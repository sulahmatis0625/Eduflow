import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id as string;

    const course = await db.course.findUnique({
      where: { id },
      select: { id: true, instructorId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && course.instructorId !== userId) {
      return NextResponse.json({ error: "You do not own this classroom" }, { status: 403 });
    }

    // Fetch all enrollments with user info
    const enrollments = await db.enrollment.findMany({
      where: { courseId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    // Fetch all quizzes for this course
    const quizzes = await db.quiz.findMany({
      where: { courseId: id },
      select: { id: true, title: true },
    });

    const quizIds = quizzes.map((q) => q.id);

    // Fetch all quiz attempts for enrolled students in this course's quizzes
    const studentIds = enrollments.map((e) => e.userId);

    const quizAttempts = quizIds.length > 0 && studentIds.length > 0
      ? await db.quizAttempt.findMany({
          where: {
            quizId: { in: quizIds },
            userId: { in: studentIds },
          },
          select: {
            id: true,
            userId: true,
            quizId: true,
            score: true,
            totalPoints: true,
            passed: true,
          },
        })
      : [];

    // Group quiz attempts by student
    const attemptsByStudent: Record<
      string,
      { score: number; totalPoints: number; passed: boolean }[]
    > = {};

    for (const attempt of quizAttempts) {
      if (!attemptsByStudent[attempt.userId]) {
        attemptsByStudent[attempt.userId] = [];
      }
      attemptsByStudent[attempt.userId].push({
        score: attempt.score,
        totalPoints: attempt.totalPoints,
        passed: attempt.passed,
      });
    }

    // Build gradebook entries
    const gradebook = enrollments.map((enrollment) => {
      const attempts = attemptsByStudent[enrollment.userId] || [];

      // Calculate average quiz score as a percentage
      let quizAvg = 0;
      if (attempts.length > 0) {
        const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
        const totalPoints = attempts.reduce((sum, a) => sum + a.totalPoints, 0);
        quizAvg = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
      }

      // Overall grade: use enrollment.grade if set, otherwise derive from quiz average
      const overallGrade = enrollment.grade ?? quizAvg;

      return {
        id: enrollment.id,
        user: enrollment.user,
        status: enrollment.status,
        progress: enrollment.progress,
        quizAvg,
        quizAttempts: attempts.length,
        overallGrade: Math.round(overallGrade),
        enrolledAt: enrollment.enrolledAt,
      };
    });

    return NextResponse.json({
      gradebook,
      totalQuizzes: quizzes.length,
    });
  } catch (error) {
    console.error("Gradebook fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch gradebook" },
      { status: 500 }
    );
  }
}
