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

    const quizzes = await db.quiz.findMany({
      where: { courseId: id },
      include: {
        _count: {
          select: { questions: true, attempts: true },
        },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("Fetch quizzes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const body = await req.json();
    const { title, description, timeLimit, passingScore, maxAttempts, questions } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "At least one question is required" },
        { status: 400 }
      );
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text || !q.text.trim()) {
        return NextResponse.json(
          { error: `Question ${i + 1} text is required` },
          { status: 400 }
        );
      }
      if (!q.correctAnswer || !q.correctAnswer.trim()) {
        return NextResponse.json(
          { error: `Question ${i + 1} correct answer is required` },
          { status: 400 }
        );
      }
    }

    // Determine order for the new quiz
    const lastQuiz = await db.quiz.findFirst({
      where: { courseId: id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const quizOrder = lastQuiz ? lastQuiz.order + 1 : 0;

    const quiz = await db.quiz.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        courseId: id,
        timeLimit: timeLimit ? parseInt(String(timeLimit), 10) : null,
        passingScore: passingScore ? parseFloat(String(passingScore)) : 70,
        maxAttempts: maxAttempts ? parseInt(String(maxAttempts), 10) : 3,
        order: quizOrder,
        questions: {
          create: questions.map((q: {
            text: string;
            type?: string;
            options?: string;
            correctAnswer: string;
            points?: number;
            explanation?: string;
          }, index: number) => ({
            text: q.text.trim(),
            type: q.type || "MULTIPLE_CHOICE",
            options: q.options || null,
            correctAnswer: q.correctAnswer.trim(),
            points: q.points ? parseInt(String(q.points), 10) : 1,
            explanation: q.explanation?.trim() || null,
            order: index,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Create quiz error:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
