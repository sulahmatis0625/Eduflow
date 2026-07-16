import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const announcements = await db.announcement.findMany({
      where: { courseId: id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Fetch announcements error:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
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

    // Verify the course exists and the user owns it
    const course = await db.course.findUnique({
      where: { id },
      select: { id: true, title: true, instructorId: true, slug: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && course.instructorId !== userId) {
      return NextResponse.json({ error: "You do not own this classroom" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Create the announcement
    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        courseId: id,
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // Get all enrolled students for this course
    const enrollments = await db.enrollment.findMany({
      where: {
        courseId: id,
        status: { in: ["ACTIVE", "APPROVED"] },
      },
      select: { userId: true },
    });

    // Create notifications for all enrolled students
    if (enrollments.length > 0) {
      await db.notification.createMany({
        data: enrollments.map((enrollment) => ({
          userId: enrollment.userId,
          title: `New Announcement: ${title}`,
          message: content.length > 120 ? content.slice(0, 120) + "..." : content,
          type: "COURSE",
          link: `/courses/${course.slug}`,
        })),
      });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
