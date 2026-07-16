import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId } = await params;

    const payment = await db.payment.update({
      where: { id: paymentId },
      data: { status: "REFUNDED" },
      include: { course: true },
    });

    await db.notification.create({
      data: {
        userId: payment.userId,
        title: "Payment Refunded",
        message: `Your payment for "${payment.course.title}" has been refunded.`,
        type: "INFO",
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Admin refund error:", error);
    return NextResponse.json({ error: "Failed to refund payment" }, { status: 500 });
  }
}
