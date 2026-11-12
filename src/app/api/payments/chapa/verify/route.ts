import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const txRef = searchParams.get("tx_ref");

    if (!txRef) {
      return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
    }

    const payment = await db.payment.findFirst({
      where: { transactionId: txRef },
      include: { course: true, user: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;

    if (chapaSecretKey && chapaSecretKey.startsWith("CHASECK")) {
      const verifyRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${chapaSecretKey}`,
        },
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.status === "success" && verifyData.data?.status === "success") {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: "COMPLETED" },
        });

        await db.enrollment.upsert({
          where: { userId_courseId: { userId: payment.userId, courseId: payment.courseId } },
          update: { status: "ACTIVE", approvedAt: new Date() },
          create: {
            userId: payment.userId,
            courseId: payment.courseId,
            status: "ACTIVE",
            approvedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.redirect(
      new URL(`/dashboard/courses?payment=success&courseId=${payment.courseId}`, req.url)
    );
  } catch (error) {
    console.error("Chapa verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
