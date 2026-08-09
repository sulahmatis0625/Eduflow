import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

/** Instructor (owner) or admin can update / publish their course. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;
    const withLessons = await db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        instructorId: true,
        sections: { select: { lessons: { select: { id: true } } } },
      },
    });

    if (!withLessons) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (
      session.user.role !== "ADMIN" &&
      withLessons.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.title === "string") data.title = body.title.trim();
    if (typeof body.description === "string") data.description = body.description;
    if (typeof body.shortDescription === "string") data.shortDescription = body.shortDescription;
    if (typeof body.level === "string") data.level = body.level;
    if (typeof body.thumbnail === "string") data.thumbnail = body.thumbnail;
    if (typeof body.previewVideo === "string") data.previewVideo = body.previewVideo;
    if (typeof body.tags === "string") data.tags = body.tags;
    if (typeof body.whatYouLearn === "string") data.whatYouLearn = body.whatYouLearn;
    if (typeof body.isFree === "boolean") {
      data.isFree = body.isFree;
      if (body.isFree) data.price = 0;
    }
    if (body.price != null) data.price = parseFloat(String(body.price));

    if (typeof body.status === "string") {
      const allowed = ["DRAFT", "PUBLISHED", "ARCHIVED", "PENDING"];
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      // Publish immediately (admin review skipped for instructor publish)
      if (body.status === "PUBLISHED") {
        const lessonCount = withLessons.sections.reduce(
          (n, s) => n + s.lessons.length,
          0
        );
        if (lessonCount === 0) {
          return NextResponse.json(
            { error: "Add at least one lesson before publishing" },
            { status: 400 }
          );
        }
      }
      data.status = body.status;
    }

    const updated = await db.course.update({
      where: { id: courseId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Course update error:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

/** Instructors may delete draft/pending courses only — never published. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { id: true, instructorId: true, status: true, title: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (
      session.user.role !== "ADMIN" &&
      course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (course.status === "PUBLISHED") {
      return NextResponse.json(
        {
          error:
            "Published courses cannot be deleted. You can add new courses instead.",
        },
        { status: 403 }
      );
    }

    await db.course.delete({ where: { id: courseId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Course delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            lessons: { orderBy: { order: "asc" } },
          },
        },
        category: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (
      session.user.role !== "ADMIN" &&
      course.instructorId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Course fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}
