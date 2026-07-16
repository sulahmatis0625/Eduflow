import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    const liveSession = await db.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
            instructor: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        attendance: {
          include: {
            user: {
              select: { id: true, name: true, image: true, role: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        chatMessages: {
          orderBy: { sentAt: "asc" },
          take: 100,
        },
      },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(liveSession);
  } catch (error) {
    console.error("Get live session error:", error);
    return NextResponse.json(
      { error: "Failed to fetch live session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await req.json();

    // Fetch session to verify ownership
    const liveSession = await db.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        course: { select: { instructorId: true } },
      },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Only the course instructor or admin can update the session
    const isInstructor = liveSession.course.instructorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    if (!isInstructor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.status) {
      updateData.status = body.status;
      if (body.status === "ENDED") {
        updateData.endTime = new Date();
      }
    }

    const updated = await db.liveSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update live session error:", error);
    return NextResponse.json(
      { error: "Failed to update live session" },
      { status: 500 }
    );
  }
}
