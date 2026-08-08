import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  isQuizUnlocked,
  quizLockReason,
  type QuizPassInfo,
  type QuizUnlockContext,
} from "@/lib/quiz-progress";

async function getCourseQuizPassInfo(
  userId: string,
  courseId: string
): Promise<QuizPassInfo[]> {
  const quizzes = await db.quiz.findMany({
    where: { courseId, isActive: true },
    orderBy: { order: "asc" },
    include: {
      attempts: {
        where: { userId },
        select: { passed: true },
      },
    },
  });

  return quizzes.map((q) => ({
    id: q.id,
    order: q.order,
    passed: q.attempts.some((a) => a.passed),
  }));
}

async function getQuizUnlockContext(
  userId: string,
  courseId: string
): Promise<QuizUnlockContext> {
  const sections = await db.section.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    select: {
      order: true,
      lessons: { select: { id: true } },
    },
  });

  const allLessonIds = sections.flatMap((s) => s.lessons.map((l) => l.id));
  const completed = allLessonIds.length
    ? await db.lessonProgress.findMany({
        where: {
          userId,
          lessonId: { in: allLessonIds },
          completed: true,
        },
        select: { lessonId: true },
      })
    : [];

  return {
    maxSectionOrder: sections.reduce((m, s) => Math.max(m, s.order), 0),
    sections: sections.map((s) => ({
      order: s.order,
      lessonIds: s.lessons.map((l) => l.id),
    })),
    completedLessonIds: completed.map((p) => p.lessonId),
  };
}

async function assertEnrolled(userId: string, courseId: string) {
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  return enrollment && ["ACTIVE", "COMPLETED"].includes(enrollment.status);
}

// Get quiz with questions
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");
    const courseId = searchParams.get("courseId");

    if (quizId) {
      const quiz = await db.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              text: true,
              type: true,
              options: true,
              points: true,
              order: true,
              // Don't send correctAnswer to client
            },
          },
          attempts: {
            where: { userId: session.user.id },
            orderBy: { startedAt: "desc" },
          },
        },
      });

      if (!quiz) {
        return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
      }

      const enrolled = await assertEnrolled(session.user.id, quiz.courseId);
      if (!enrolled) {
        return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
      }

      const [passInfo, unlockCtx] = await Promise.all([
        getCourseQuizPassInfo(session.user.id, quiz.courseId),
        getQuizUnlockContext(session.user.id, quiz.courseId),
      ]);
      if (!isQuizUnlocked(quiz.order, passInfo, unlockCtx)) {
        return NextResponse.json(
          {
            error: quizLockReason(quiz.order, passInfo, unlockCtx),
            locked: true,
            quiz: {
              id: quiz.id,
              title: quiz.title,
              courseId: quiz.courseId,
              order: quiz.order,
              passingScore: quiz.passingScore,
              maxAttempts: quiz.maxAttempts,
            },
          },
          { status: 403 }
        );
      }

      return NextResponse.json(quiz);
    }

    if (courseId) {
      const enrolled = await assertEnrolled(session.user.id, courseId);
      if (!enrolled) {
        return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
      }

      const [passInfo, unlockCtx] = await Promise.all([
        getCourseQuizPassInfo(session.user.id, courseId),
        getQuizUnlockContext(session.user.id, courseId),
      ]);
      const quizzes = await db.quiz.findMany({
        where: { courseId, isActive: true },
        include: {
          _count: { select: { questions: true } },
          attempts: {
            where: { userId: session.user.id },
            orderBy: { startedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { order: "asc" },
      });

      return NextResponse.json(
        quizzes.map((q) => ({
          ...q,
          unlocked: isQuizUnlocked(q.order, passInfo, unlockCtx),
          passed: passInfo.find((p) => p.id === q.id)?.passed ?? false,
        }))
      );
    }

    return NextResponse.json({ error: "Missing quizId or courseId" }, { status: 400 });
  } catch (error) {
    console.error("Quiz fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}

// Submit quiz attempt
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId, answers } = await req.json();
    // answers: [{ questionId: string, answer: string }]

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const enrolled = await assertEnrolled(session.user.id, quiz.courseId);
    if (!enrolled) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    const [passInfo, unlockCtx] = await Promise.all([
      getCourseQuizPassInfo(session.user.id, quiz.courseId),
      getQuizUnlockContext(session.user.id, quiz.courseId),
    ]);
    if (!isQuizUnlocked(quiz.order, passInfo, unlockCtx)) {
      return NextResponse.json(
        { error: quizLockReason(quiz.order, passInfo, unlockCtx) },
        { status: 403 }
      );
    }

    // Check attempt limit
    const attemptCount = await db.quizAttempt.count({
      where: { userId: session.user.id, quizId },
    });

    if (attemptCount >= quiz.maxAttempts) {
      return NextResponse.json({ error: "Maximum attempts reached" }, { status: 403 });
    }

    // Grade the quiz
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers: { questionId: string; answer: string; isCorrect: boolean; points: number }[] = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const studentAnswer = answers.find((a: { questionId: string }) => a.questionId === question.id);

      if (studentAnswer) {
        const isCorrect = studentAnswer.answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        const points = isCorrect ? question.points : 0;
        earnedPoints += points;

        gradedAnswers.push({
          questionId: question.id,
          answer: studentAnswer.answer,
          isCorrect,
          points,
        });
      } else {
        gradedAnswers.push({
          questionId: question.id,
          answer: "",
          isCorrect: false,
          points: 0,
        });
      }
    }

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = score >= quiz.passingScore;

    // Create attempt
    const attempt = await db.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId,
        score,
        totalPoints,
        passed,
        completedAt: new Date(),
        answers: {
          create: gradedAnswers,
        },
      },
      include: { answers: true },
    });

    // Award XP for passing
    if (passed) {
      await db.user.update({
        where: { id: session.user.id },
        data: { xp: { increment: 20 } },
      });
    }

    // Update enrollment grade (use best score across all course quizzes)
    const bestAttempt = await db.quizAttempt.findFirst({
      where: {
        userId: session.user.id,
        quiz: { courseId: quiz.courseId },
      },
      orderBy: { score: "desc" },
    });

    const enrollment = await db.enrollment.findFirst({
      where: { userId: session.user.id, courseId: quiz.courseId },
    });

    if (enrollment && bestAttempt) {
      await db.enrollment.update({
        where: { id: enrollment.id },
        data: { grade: bestAttempt.score },
      });
    }

    // If this is the final quiz (highest order) and passed → complete course + certificate
    let courseCompleted = false;
    let certificateId: string | null = null;

    if (passed) {
      const courseQuizzes = await db.quiz.findMany({
        where: { courseId: quiz.courseId, isActive: true },
        select: { id: true, order: true },
        orderBy: { order: "asc" },
      });
      const maxOrder = courseQuizzes.reduce(
        (max, q) => Math.max(max, q.order),
        0
      );
      const isFinalQuiz = quiz.order === maxOrder;

      if (isFinalQuiz && enrollment) {
        const course = await db.course.findUnique({
          where: { id: quiz.courseId },
          select: {
            id: true,
            title: true,
            passingGrade: true,
            certificateEnabled: true,
          },
        });

        await db.enrollment.update({
          where: { id: enrollment.id },
          data: {
            status: "COMPLETED",
            progress: 100,
            grade: bestAttempt?.score ?? score,
            completedAt: new Date(),
          },
        });
        courseCompleted = true;

        if (course?.certificateEnabled) {
          const existingCert = await db.certificate.findUnique({
            where: {
              userId_courseId: {
                userId: session.user.id,
                courseId: quiz.courseId,
              },
            },
          });

          if (existingCert) {
            certificateId = existingCert.certificateId;
          } else {
            const grade = bestAttempt?.score ?? score;
            const newCertId = `EF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
            const certificate = await db.certificate.create({
              data: {
                userId: session.user.id,
                courseId: quiz.courseId,
                certificateId: newCertId,
                grade,
              },
            });
            certificateId = certificate.certificateId;

            await db.user.update({
              where: { id: session.user.id },
              data: { xp: { increment: 100 } },
            });

            await db.notification.create({
              data: {
                userId: session.user.id,
                title: "Certificate Earned!",
                message: `Congratulations! You've earned a certificate for "${course.title}"!`,
                type: "ACHIEVEMENT",
                link: "/dashboard/certificates",
              },
            });
          }
        }
      }
    }

    const attemptsRemaining = Math.max(0, quiz.maxAttempts - (attemptCount + 1));

    return NextResponse.json({
      attempt,
      score,
      passed,
      totalPoints,
      earnedPoints,
      courseCompleted,
      certificateId,
      attemptsRemaining,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    });
  } catch (error) {
    console.error("Quiz submission error:", error);
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 });
  }
}
