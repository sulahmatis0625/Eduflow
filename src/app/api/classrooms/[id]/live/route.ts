import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

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
      select: { id: true, title: true, instructorId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && course.instructorId !== userId) {
      return NextResponse.json({ error: "You do not own this classroom" }, { status: 403 });
    }

    // Check if there's already an active live session
    const existingLive = await db.liveSession.findFirst({
      where: {
        courseId: id,
        status: "LIVE",
      },
    });

    if (existingLive) {
      return NextResponse.json(existingLive);
    }

    // Parse optional title from body
    const body = await req.json().catch(() => ({}));
    const title = body.title || `${course.title} - Live Session`;

    const liveSession = await db.liveSession.create({
      data: {
        title,
        courseId: id,
        startTime: new Date(),
        status: "LIVE",
      },
    });

    return NextResponse.json(liveSession);
  } catch (error) {
    console.error("Start live session error:", error);
    return NextResponse.json(
      { error: "Failed to start live session" },
      { status: 500 }
    );
  }
}
