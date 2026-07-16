import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, couponCode } = await req.json();

    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (course.isFree || course.price === 0) {
      return NextResponse.json({ error: "Course is free, no payment needed" }, { status: 400 });
    }

    // Check for existing payment
    const existingPayment = await db.payment.findFirst({
      where: { userId: session.user.id, courseId, status: "COMPLETED" },
    });

    if (existingPayment) {
      return NextResponse.json({ error: "Already paid for this course" }, { status: 409 });
    }

    let finalAmount = course.discountPrice || course.price;

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.isActive && coupon.usedCount < coupon.maxUses && new Date() <= coupon.validUntil) {
        if (!coupon.courseId || coupon.courseId === courseId) {
          finalAmount = finalAmount * (1 - coupon.discount / 100);
          await db.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
    }

    // Create payment record (simulating Stripe payment)
    // In production, this would create a Stripe checkout session
    const payment = await db.payment.create({
      data: {
        userId: session.user.id,
        courseId,
        amount: finalAmount,
        currency: course.currency,
        status: "COMPLETED", // Simulated - in production this would be PENDING until Stripe confirms
        method: "STRIPE",
        transactionId: `sim_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      },
    });

    // Auto-enroll after payment
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: session.user.id, courseId } },
      update: { status: "ACTIVE", approvedAt: new Date() },
      create: {
        userId: session.user.id,
        courseId,
        status: "ACTIVE",
        approvedAt: new Date(),
      },
    });

    // Award XP
    await db.user.update({
      where: { id: session.user.id },
      data: { xp: { increment: 10 } },
    });

    await db.notification.create({
      data: {
        userId: session.user.id,
        title: "Payment Successful!",
        message: `You've successfully purchased "${course.title}". Start learning now!`,
        type: "PAYMENT",
        link: `/learn/${courseId}`,
      },
    });

    return NextResponse.json({ payment, message: "Payment successful" });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payments = await db.payment.findMany({
      where: { userId: session.user.id },
      include: { course: { select: { title: true, slug: true, thumbnail: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Payments fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
