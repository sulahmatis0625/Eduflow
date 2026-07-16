import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sections = await db.section.findMany({
      where: { courseId: id },
      orderBy: { order: "asc" },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Fetch sections error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sections" },
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
    const { title, order } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // If no order provided, append to end
    let sectionOrder = order;
    if (sectionOrder === undefined || sectionOrder === null) {
      const lastSection = await db.section.findFirst({
        where: { courseId: id },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      sectionOrder = lastSection ? lastSection.order + 1 : 0;
    }

    const section = await db.section.create({
      data: {
        title: title.trim(),
        order: sectionOrder,
        courseId: id,
      },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error("Create section error:", error);
    return NextResponse.json(
      { error: "Failed to create section" },
      { status: 500 }
    );
  }
}
