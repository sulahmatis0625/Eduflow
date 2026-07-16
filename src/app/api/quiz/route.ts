import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

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

      return NextResponse.json(quiz);
    }

    if (courseId) {
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

      return NextResponse.json(quizzes);
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

    // Update enrollment grade (use best score)
    const bestAttempt = await db.quizAttempt.findFirst({
      where: { userId: session.user.id, quizId },
      orderBy: { score: "desc" },
    });

    if (bestAttempt) {
      const enrollment = await db.enrollment.findFirst({
        where: { userId: session.user.id, courseId: quiz.courseId },
      });

      if (enrollment) {
        await db.enrollment.update({
          where: { id: enrollment.id },
          data: { grade: bestAttempt.score },
        });
      }
    }

    return NextResponse.json({
      attempt,
      score,
      passed,
      totalPoints,
      earnedPoints,
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
