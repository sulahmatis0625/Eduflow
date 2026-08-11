import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

async function assertCourseAccess(courseId: string, userId: string, role: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      instructorId: true,
      sections: {
        orderBy: { order: "asc" },
        select: { id: true, title: true, order: true },
      },
    },
  });

  if (!course) return { error: NextResponse.json({ error: "Classroom not found" }, { status: 404 }) };
  if (role !== "ADMIN" && course.instructorId !== userId) {
    return { error: NextResponse.json({ error: "You do not own this classroom" }, { status: 403 }) };
  }
  return { course };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, quizId } = await params;
    const access = await assertCourseAccess(id, session.user.id as string, session.user.role);
    if (access.error) return access.error;

    const quiz = await db.quiz.findUnique({
      where: { id: quizId, courseId: id },
      include: {
        questions: { orderBy: { order: "asc" } },
        _count: { select: { attempts: true } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Fetch quiz error:", error);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, quizId } = await params;
    const access = await assertCourseAccess(id, session.user.id as string, session.user.role);
    if (access.error) return access.error;
    const course = access.course!;

    const existing = await db.quiz.findUnique({
      where: { id: quizId, courseId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      description,
      timeLimit,
      passingScore,
      maxAttempts,
      isActive,
      isFinal,
      sectionOrder,
      questions,
    } = body;

    const maxSectionOrder = course.sections.reduce(
      (max, s) => Math.max(max, s.order),
      0
    );

    let nextOrder: number | undefined;
    if (isFinal === true) {
      nextOrder = maxSectionOrder + 1;
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
      nextOrder = section.order;
    }

    if (nextOrder != null && nextOrder !== existing.order) {
      const conflict = await db.quiz.findFirst({
        where: { courseId: id, order: nextOrder, NOT: { id: quizId } },
        select: { id: true, title: true },
      });
      if (conflict) {
        return NextResponse.json(
          {
            error:
              isFinal === true
                ? "A final exam already exists for this course"
                : `A quiz already exists for this chapter (${conflict.title})`,
          },
          { status: 409 }
        );
      }
    }

    if (questions !== undefined) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json(
          { error: "At least one question is required" },
          { status: 400 }
        );
      }
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.text?.trim()) {
          return NextResponse.json(
            { error: `Question ${i + 1} text is required` },
            { status: 400 }
          );
        }
        if (!q.correctAnswer?.trim()) {
          return NextResponse.json(
            { error: `Question ${i + 1} correct answer is required` },
            { status: 400 }
          );
        }
      }
    }

    const quiz = await db.$transaction(async (tx) => {
      if (questions !== undefined) {
        await tx.question.deleteMany({ where: { quizId } });
        await tx.question.createMany({
          data: questions.map(
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
              quizId,
              text: q.text.trim(),
              type: q.type || "MULTIPLE_CHOICE",
              options: q.options || null,
              correctAnswer: q.correctAnswer.trim(),
              points: q.points ? parseInt(String(q.points), 10) : 1,
              explanation: q.explanation?.trim() || null,
              order: index,
            })
          ),
        });
      }

      return tx.quiz.update({
        where: { id: quizId },
        data: {
          ...(title !== undefined ? { title: String(title).trim() } : {}),
          ...(description !== undefined
            ? { description: description ? String(description).trim() : null }
            : {}),
          ...(timeLimit !== undefined
            ? { timeLimit: timeLimit ? parseInt(String(timeLimit), 10) : null }
            : {}),
          ...(passingScore !== undefined
            ? { passingScore: parseFloat(String(passingScore)) }
            : {}),
          ...(maxAttempts !== undefined
            ? { maxAttempts: parseInt(String(maxAttempts), 10) }
            : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
          ...(nextOrder != null ? { order: nextOrder } : {}),
        },
        include: {
          questions: { orderBy: { order: "asc" } },
          _count: { select: { questions: true, attempts: true } },
        },
      });
    });

    const isFinalQuiz =
      maxSectionOrder > 0 && quiz.order === maxSectionOrder + 1;

    return NextResponse.json({
      ...quiz,
      isFinal: isFinalQuiz,
      sectionTitle:
        course.sections.find((s) => s.order === quiz.order)?.title ?? null,
      sectionOrder: isFinalQuiz ? null : quiz.order,
    });
  } catch (error) {
    console.error("Update quiz error:", error);
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, quizId } = await params;
    const access = await assertCourseAccess(id, session.user.id as string, session.user.role);
    if (access.error) return access.error;

    const existing = await db.quiz.findUnique({
      where: { id: quizId, courseId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    await db.quiz.delete({ where: { id: quizId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete quiz error:", error);
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 });
  }
}
