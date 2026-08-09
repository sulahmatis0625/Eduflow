import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  isQuizUnlocked,
  isSectionUnlocked,
  areQuizLessonsComplete,
  type QuizUnlockContext,
} from "@/lib/quiz-progress";
import { courseSkipsWatchGate } from "@/lib/demo-courses";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
    });

    if (!enrollment || !["ACTIVE", "COMPLETED", "APPROVED"].includes(enrollment.status)) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { name: true, image: true } },
        sections: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
        quizzes: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          include: {
            _count: { select: { questions: true } },
            attempts: {
              where: { userId: session.user.id },
              orderBy: { score: "desc" },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const allLessonIds = course.sections.flatMap((s) => s.lessons.map((l) => l.id));
    const allProgress = await db.lessonProgress.findMany({
      where: {
        userId: session.user.id,
        lessonId: { in: allLessonIds },
      },
      select: { lessonId: true, completed: true, watchTime: true },
    });

    const completedLessonIds = allProgress
      .filter((p) => p.completed)
      .map((p) => p.lessonId);
    const lessonWatchTimes = Object.fromEntries(
      allProgress.map((p) => [p.lessonId, p.watchTime])
    );
    const maxSectionOrder = course.sections.reduce(
      (max, s) => Math.max(max, s.order),
      0
    );

    const unlockCtx: QuizUnlockContext = {
      maxSectionOrder,
      sections: course.sections.map((s) => ({
        order: s.order,
        lessonIds: s.lessons.map((l) => l.id),
      })),
      completedLessonIds,
    };

    const quizPassInfo = course.quizzes.map((q) => ({
      id: q.id,
      order: q.order,
      passed: q.attempts.some((a) => a.passed),
    }));

    const quizzes = course.quizzes.map((q) => {
      const best = q.attempts[0];
      const chapterComplete = areQuizLessonsComplete(q.order, unlockCtx);
      return {
        id: q.id,
        title: q.title,
        description: q.description,
        order: q.order,
        timeLimit: q.timeLimit,
        passingScore: q.passingScore,
        maxAttempts: q.maxAttempts,
        questionCount: q._count.questions,
        attemptsUsed: q.attempts.length,
        passed: quizPassInfo.find((p) => p.id === q.id)?.passed ?? false,
        bestScore: best?.score ?? null,
        chapterComplete,
        unlocked: isQuizUnlocked(q.order, quizPassInfo, unlockCtx),
      };
    });

    const sections = course.sections.map((section) => ({
      ...section,
      unlocked: isSectionUnlocked(section.order, quizPassInfo),
    }));

    return NextResponse.json({
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      instructor: course.instructor,
      sections,
      quizzes,
      enrollment: { progress: enrollment.progress, status: enrollment.status },
      completedLessons: completedLessonIds,
      lessonWatchTimes,
      skipWatchGate: courseSkipsWatchGate(course.slug, course.title),
    });
  } catch (error) {
    console.error("Learn fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}
