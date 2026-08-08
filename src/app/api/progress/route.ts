import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { issueCertificateIfEligible } from "@/lib/certificates";
import { courseRequiresFinalQuiz } from "@/lib/course-completion";

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

    const allLessons = lesson.section.course.sections.flatMap((s) => s.lessons);
    const totalLessons = allLessons.length;

    const completedLessons = await db.lessonProgress.count({
      where: {
        userId: session.user.id,
        lessonId: { in: allLessons.map((l) => l.id) },
        completed: true,
      },
    });

    const courseProgress =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    const needsFinal =
      courseProgress === 100
        ? await courseRequiresFinalQuiz(courseId)
        : false;

    await db.enrollment.updateMany({
      where: { userId: session.user.id, courseId },
      data: {
        progress: courseProgress,
        // Complete + certify from lessons only when the course has no quizzes
        ...(courseProgress === 100 && !needsFinal
          ? { status: "COMPLETED", completedAt: new Date(), grade: 100 }
          : {}),
      },
    });

    if (completed) {
      await db.user.update({
        where: { id: session.user.id },
        data: { xp: { increment: 5 } },
      });
    }

    let certificateId: string | null = null;

    if (courseProgress === 100) {
      await db.user.update({
        where: { id: session.user.id },
        data: { xp: { increment: 50 } },
      });

      if (!needsFinal) {
        const certificate = await issueCertificateIfEligible(
          session.user.id,
          courseId,
          100
        );
        certificateId = certificate?.certificateId ?? null;

        await db.notification.create({
          data: {
            userId: session.user.id,
            title: "Course Completed!",
            message: certificate
              ? `Congratulations! You've completed "${lesson.section.course.title}" and your certificate is ready.`
              : `Congratulations! You've completed "${lesson.section.course.title}".`,
            type: "SUCCESS",
            link: certificate
              ? "/dashboard/certificates"
              : `/courses/${lesson.section.course.slug}`,
          },
        });
      } else {
        await db.notification.create({
          data: {
            userId: session.user.id,
            title: "All lessons complete!",
            message: `You've finished every lesson in "${lesson.section.course.title}". Pass the final exam to earn your certificate.`,
            type: "INFO",
            link: `/learn/${courseId}`,
          },
        });
      }
    }

    return NextResponse.json({
      progress: courseProgress,
      lessonProgress: progress,
      certificateId,
    });
  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
