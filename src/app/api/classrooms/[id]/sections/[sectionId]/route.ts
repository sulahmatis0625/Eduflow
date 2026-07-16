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
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, sectionId } = await params;
    const userId = session.user.id as string;

    const ownership = await verifyCourseOwnership(id, userId, session.user.role);
    if ("error" in ownership) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status });
    }

    // Verify section belongs to this course
    const existingSection = await db.section.findFirst({
      where: { id: sectionId, courseId: id },
    });

    if (!existingSection) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, order } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (order !== undefined) updateData.order = order;

    const section = await db.section.update({
      where: { id: sectionId },
      data: updateData,
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error("Update section error:", error);
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, sectionId } = await params;
    const userId = session.user.id as string;

    const ownership = await verifyCourseOwnership(id, userId, session.user.role);
    if ("error" in ownership) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status });
    }

    // Verify section belongs to this course
    const existingSection = await db.section.findFirst({
      where: { id: sectionId, courseId: id },
    });

    if (!existingSection) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Delete section (cascade deletes lessons via schema)
    await db.section.delete({
      where: { id: sectionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete section error:", error);
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 }
    );
  }
}
