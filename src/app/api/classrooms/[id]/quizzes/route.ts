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
      select: {
        id: true,
        instructorId: true,
        sections: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true },
        },
      },
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

    const maxSectionOrder = course.sections.reduce(
      (max, s) => Math.max(max, s.order),
      0
    );

    const enriched = quizzes.map((q) => {
      const section = course.sections.find((s) => s.order === q.order);
      const isFinal = maxSectionOrder > 0 && q.order === maxSectionOrder + 1;
      return {
        ...q,
        isFinal,
        sectionTitle: section?.title ?? null,
        sectionOrder: section?.order ?? null,
      };
    });

    return NextResponse.json({
      quizzes: enriched,
      sections: course.sections,
      maxSectionOrder,
    });
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
      select: {
        id: true,
        instructorId: true,
        sections: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, order: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && course.instructorId !== userId) {
      return NextResponse.json({ error: "You do not own this classroom" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      timeLimit,
      passingScore,
      maxAttempts,
      questions,
      isFinal,
      sectionOrder,
      order: explicitOrder,
    } = body;

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

    const maxSectionOrder = course.sections.reduce(
      (max, s) => Math.max(max, s.order),
      0
    );

    if (course.sections.length === 0) {
      return NextResponse.json(
        { error: "Add chapters/lessons before creating quizzes" },
        { status: 400 }
      );
    }

    let quizOrder: number;

    if (isFinal) {
      quizOrder = maxSectionOrder + 1;
    } else if (sectionOrder != null) {
      const section = course.sections.find(
        (s) => s.order === parseInt(String(sectionOrder), 10)
      );
      if (!section) {
        return NextResponse.json(
          { error: "Invalid chapter for this quiz" },
          { status: 400 }
        );
      }
      quizOrder = section.order;
    } else if (explicitOrder != null) {
      quizOrder = parseInt(String(explicitOrder), 10);
      if (!Number.isFinite(quizOrder) || quizOrder < 1) {
        return NextResponse.json({ error: "Invalid quiz order" }, { status: 400 });
      }
    } else {
      return NextResponse.json(
        { error: "Select a chapter or mark as final exam" },
        { status: 400 }
      );
    }

    const conflict = await db.quiz.findFirst({
      where: { courseId: id, order: quizOrder },
      select: { id: true, title: true },
    });
    if (conflict) {
      return NextResponse.json(
        {
          error: isFinal
            ? "A final exam already exists for this course"
            : `A quiz already exists for this chapter (${conflict.title})`,
        },
        { status: 409 }
      );
    }

    const quiz = await db.quiz.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        courseId: id,
        timeLimit: timeLimit ? parseInt(String(timeLimit), 10) : null,
        passingScore: passingScore != null ? parseFloat(String(passingScore)) : 50,
        maxAttempts: maxAttempts != null ? parseInt(String(maxAttempts), 10) : 3,
        order: quizOrder,
        isActive: true,
        questions: {
          create: questions.map(
            (
              q: {
                text: string;
                type?: string;
                options?: string;
                correctAnswer: string;
                points?: number;
                explanation?: string;
              },
              index: number
            ) => ({
              text: q.text.trim(),
              type: q.type || "MULTIPLE_CHOICE",
              options: q.options || null,
              correctAnswer: q.correctAnswer.trim(),
              points: q.points ? parseInt(String(q.points), 10) : 1,
              explanation: q.explanation?.trim() || null,
              order: index,
            })
          ),
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

    return NextResponse.json({
      ...quiz,
      isFinal: Boolean(isFinal) || quizOrder === maxSectionOrder + 1,
      sectionOrder: isFinal ? null : quizOrder,
    });
  } catch (error) {
    console.error("Create quiz error:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
