import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

async function verifyCourseOwnership(courseId: string, userId: string, role: string) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, instructorId: true },
  });

  if (!course) return { error: "Classroom not found", status: 404 };
  if (role !== "ADMIN" && course.instructorId !== userId) {
    return { error: "You do not own this classroom", status: 403 };
  }
  return { course };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, lessonId } = await params;
    const userId = session.user.id as string;

    const ownership = await verifyCourseOwnership(id, userId, session.user.role);
    if ("error" in ownership) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status });
    }

    // Verify lesson belongs to a section of this course
    const existingLesson = await db.lesson.findFirst({
      where: {
        id: lessonId,
        section: { courseId: id },
      },
    });

    if (!existingLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, type, content, duration, order, videoUrl, description, isFree, isPreview } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (type !== undefined) updateData.type = type;
    if (content !== undefined) updateData.content = content;
    if (duration !== undefined) updateData.duration = parseInt(String(duration), 10);
    if (order !== undefined) updateData.order = order;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (description !== undefined) updateData.description = description;
    if (isFree !== undefined) updateData.isFree = isFree;
    if (isPreview !== undefined) updateData.isPreview = isPreview;

    const lesson = await db.lesson.update({
      where: { id: lessonId },
      data: updateData,
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Update lesson error:", error);
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, lessonId } = await params;
    const userId = session.user.id as string;

    const ownership = await verifyCourseOwnership(id, userId, session.user.role);
    if ("error" in ownership) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status });
    }

    // Verify lesson belongs to a section of this course
    const existingLesson = await db.lesson.findFirst({
      where: {
        id: lessonId,
        section: { courseId: id },
      },
    });

    if (!existingLesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    await db.lesson.delete({
      where: { id: lessonId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete lesson error:", error);
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    );
  }
}
