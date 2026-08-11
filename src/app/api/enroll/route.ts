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

    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
    }

    // Instant enroll for all courses (payment flow deferred)
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
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 });
  }
}
