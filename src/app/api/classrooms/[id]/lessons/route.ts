import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const VALID_LESSON_TYPES = ["VIDEO", "TEXT", "FILE", "QUIZ", "ASSIGNMENT", "LIVE"];

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
    const { title, type, sectionId, content, duration, order, videoUrl, isFree, isPreview } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!sectionId) {
      return NextResponse.json({ error: "Section ID is required" }, { status: 400 });
    }

    // Verify section belongs to this course
    const section = await db.section.findFirst({
      where: { id: sectionId, courseId: id },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found in this course" }, { status: 404 });
    }

    const lessonType = type && VALID_LESSON_TYPES.includes(type) ? type : "VIDEO";

    // If no order provided, append to end
    let lessonOrder = order;
    if (lessonOrder === undefined || lessonOrder === null) {
      const lastLesson = await db.lesson.findFirst({
        where: { sectionId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      lessonOrder = lastLesson ? lastLesson.order + 1 : 0;
    }

    const lesson = await db.lesson.create({
      data: {
        title: title.trim(),
        type: lessonType,
        sectionId,
        content: content || null,
        videoUrl: videoUrl || null,
        duration: duration ? parseInt(String(duration), 10) : 0,
        order: lessonOrder,
        isFree: !!isFree,
        isPreview: !!isPreview,
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Create lesson error:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}
