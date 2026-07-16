import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const payments = await db.payment.findMany({
      where: where as any,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const allPayments = await db.payment.findMany();
    const completed = allPayments.filter((p) => p.status === "COMPLETED");
    const pending = allPayments.filter((p) => p.status === "PENDING");
    const refunded = allPayments.filter((p) => p.status === "REFUNDED");

    const stats = {
      totalRevenue: completed.reduce((sum, p) => sum + p.amount, 0),
      completedPayments: completed.length,
      pendingPayments: pending.length,
      refundedAmount: refunded.reduce((sum, p) => sum + p.amount, 0),
    };

    return NextResponse.json({ payments, stats });
  } catch (error) {
    console.error("Admin payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
