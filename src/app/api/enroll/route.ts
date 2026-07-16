import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await req.json();

    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if already enrolled
    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    // For free courses, auto-approve
    if (course.isFree || course.price === 0) {
      const enrollment = await db.enrollment.create({
        data: {
          userId: session.user.id,
          courseId,
          status: "ACTIVE",
          approvedAt: new Date(),
        },
      });

      // Award XP for enrolling
      await db.user.update({
        where: { id: session.user.id },
        data: { xp: { increment: 10 } },
      });

      await db.notification.create({
        data: {
          userId: session.user.id,
          title: "Enrollment Confirmed!",
          message: `You've been enrolled in "${course.title}". Start learning now!`,
          type: "SUCCESS",
          link: `/learn/${courseId}`,
        },
      });

      return NextResponse.json(enrollment);
    }

    // For paid courses, check if payment exists
    const payment = await db.payment.findFirst({
      where: { userId: session.user.id, courseId, status: "COMPLETED" },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment required", requiresPayment: true }, { status: 402 });
    }

    const enrollment = await db.enrollment.create({
      data: {
        userId: session.user.id,
        courseId,
        status: "ACTIVE",
        approvedAt: new Date(),
      },
    });

    await db.user.update({
      where: { id: session.user.id },
      data: { xp: { increment: 10 } },
    });

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
  }
}
