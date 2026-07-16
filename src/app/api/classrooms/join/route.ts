import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Only students can join classrooms" },
        { status: 403 }
      );
    }

    const { code } = await req.json();

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "Join code is required" },
        { status: 400 }
      );
    }

    const slug = code.trim().toLowerCase();

    const course = await db.course.findUnique({
      where: { slug },
      select: { id: true, title: true, status: true },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Classroom not found. Please check the code and try again." },
        { status: 404 }
      );
    }

    if (course.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "This classroom is not currently accepting new students." },
        { status: 403 }
      );
    }

    // Check if already enrolled
    const existing = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id as string,
          courseId: course.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You are already enrolled in this classroom." },
        { status: 409 }
      );
    }

    const userId = session.user.id as string;

    // Create enrollment with ACTIVE status (auto-approved via join code)
    const enrollment = await db.enrollment.create({
      data: {
        userId,
        courseId: course.id,
        status: "ACTIVE",
        approvedAt: new Date(),
      },
    });

    // Award 10 XP for joining
    await db.user.update({
      where: { id: userId },
      data: { xp: { increment: 10 } },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId,
        title: "Joined Classroom!",
        message: `You've joined "${course.title}" via invite code. Start learning now!`,
        type: "SUCCESS",
        link: `/learn/${course.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      enrollment,
      courseTitle: course.title,
    });
  } catch (error) {
    console.error("Join classroom error:", error);
    return NextResponse.json(
      { error: "Failed to join classroom" },
      { status: 500 }
    );
  }
}
