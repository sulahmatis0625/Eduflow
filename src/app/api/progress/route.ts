import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId, completed, watchTime } = await req.json();

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          include: {
            course: {
              include: {
                sections: {
                  include: { lessons: true },
                },
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const courseId = lesson.section.courseId;

    // Update or create lesson progress
    const progress = await db.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: session.user.id, lessonId },
      },
      update: {
        completed: completed ?? undefined,
        watchTime: watchTime ?? undefined,
        completedAt: completed ? new Date() : undefined,
      },
      create: {
        userId: session.user.id,
        lessonId,
        completed: completed ?? false,
        watchTime: watchTime ?? 0,
        completedAt: completed ? new Date() : undefined,
      },
    });

    // Calculate overall course progress
    const allLessons = lesson.section.course.sections.flatMap((s) => s.lessons);
    const totalLessons = allLessons.length;

    const completedLessons = await db.lessonProgress.count({
      where: {
        userId: session.user.id,
        lessonId: { in: allLessons.map((l) => l.id) },
        completed: true,
      },
    });

    const courseProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Update enrollment progress
    await db.enrollment.updateMany({
      where: { userId: session.user.id, courseId },
      data: {
        progress: courseProgress,
        ...(courseProgress === 100 ? { status: "COMPLETED", completedAt: new Date() } : {}),
      },
    });

    // Award XP for completing a lesson
    if (completed) {
      await db.user.update({
        where: { id: session.user.id },
        data: { xp: { increment: 5 } },
      });
    }

    // If course completed, award bonus XP
    if (courseProgress === 100) {
      await db.user.update({
        where: { id: session.user.id },
        data: { xp: { increment: 50 } },
      });

      await db.notification.create({
        data: {
          userId: session.user.id,
          title: "Course Completed!",
          message: `Congratulations! You've completed "${lesson.section.course.title}". Check if you qualify for a certificate!`,
          type: "SUCCESS",
          link: `/dashboard/certificates`,
        },
      });
    }

    return NextResponse.json({ progress: courseProgress, lessonProgress: progress });
  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
