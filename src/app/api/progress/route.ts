import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { issueCertificateIfEligible } from "@/lib/certificates";
import { courseRequiresFinalQuiz } from "@/lib/course-completion";
import { courseSkipsWatchGate } from "@/lib/demo-courses";

const WATCH_COMPLETE_RATIO = 0.9;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const lessonId = body.lessonId as string;
    const wantComplete = Boolean(body.completed);
    const incomingWatch =
      body.watchTime != null ? Math.max(0, Math.floor(Number(body.watchTime))) : null;
    const videoDuration =
      body.videoDuration != null
        ? Math.max(0, Math.floor(Number(body.videoDuration)))
        : null;

    if (!lessonId) {
      return NextResponse.json({ error: "lessonId is required" }, { status: 400 });
    }

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

    const existing = await db.lessonProgress.findUnique({
      where: {
        userId_lessonId: { userId: session.user.id, lessonId },
      },
    });

    const nextWatchTime = Math.max(
      existing?.watchTime ?? 0,
      incomingWatch ?? 0
    );

    // VIDEO lessons require ~90% watch before Mark Complete (except demo playlist courses)
    const isVideo = lesson.type === "VIDEO" && Boolean(lesson.videoUrl);
    const skipWatchGate = courseSkipsWatchGate(
      lesson.section.course.slug,
      lesson.section.course.title
    );
    if (wantComplete && isVideo && !existing?.completed && !skipWatchGate) {
      const durationSeconds =
        videoDuration && videoDuration > 0
          ? videoDuration
          : lesson.duration > 0
            ? lesson.duration * 60
            : 0;

      const required =
        durationSeconds > 0
          ? Math.floor(durationSeconds * WATCH_COMPLETE_RATIO)
          : 0;

      if (required > 0 && nextWatchTime < required) {
        const watchedPct =
          durationSeconds > 0
            ? Math.round((nextWatchTime / durationSeconds) * 100)
            : 0;
        return NextResponse.json(
          {
            error: `Not completed yet — watch at least 90% of the video first (you've watched about ${watchedPct}%).`,
            watchTime: nextWatchTime,
            requiredWatchTime: required,
            watchedPercent: watchedPct,
          },
          { status: 400 }
        );
      }
    }

    const becomingComplete = wantComplete && !existing?.completed;

    const progress = await db.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: session.user.id, lessonId },
      },
      update: {
        watchTime: nextWatchTime,
        ...(wantComplete
          ? { completed: true, completedAt: existing?.completedAt ?? new Date() }
          : {}),
      },
      create: {
        userId: session.user.id,
        lessonId,
        completed: wantComplete,
        watchTime: nextWatchTime,
        completedAt: wantComplete ? new Date() : undefined,
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
        ...(courseProgress === 100 && !needsFinal
          ? { status: "COMPLETED", completedAt: new Date(), grade: 100 }
          : {}),
      },
    });

    if (becomingComplete) {
      await db.user.update({
        where: { id: session.user.id },
        data: { xp: { increment: 5 } },
      });
    }

    let certificateId: string | null = null;

    if (courseProgress === 100 && becomingComplete) {
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
