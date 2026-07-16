import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

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

    const quiz = await db.quiz.findUnique({
      where: { id: quizId, courseId: id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Fetch quiz error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
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

    const existing = await db.quiz.findUnique({
      where: { id: quizId, courseId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, timeLimit, passingScore, maxAttempts, isActive } = body;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title.trim();
    if (timeLimit !== undefined) updateData.timeLimit = timeLimit ? parseInt(String(timeLimit), 10) : null;
    if (passingScore !== undefined) updateData.passingScore = parseFloat(String(passingScore));
    if (maxAttempts !== undefined) updateData.maxAttempts = parseInt(String(maxAttempts), 10);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const quiz = await db.quiz.update({
      where: { id: quizId },
      data: updateData,
      include: {
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Update quiz error:", error);
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    );
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

    const existing = await db.quiz.findUnique({
      where: { id: quizId, courseId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    await db.quiz.delete({
      where: { id: quizId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete quiz error:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
