import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  try {
    const { discussionId } = await params;

    const discussion = await db.discussion.findUnique({
      where: { id: discussionId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { comments: true } },
      },
    });

    if (!discussion) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    return NextResponse.json(discussion);
  } catch (error) {
    console.error("Discussion fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch discussion" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { discussionId } = await params;
    const body = await req.json();

    const discussion = await db.discussion.findUnique({
      where: { id: discussionId },
      include: { course: { select: { instructorId: true } } },
    });

    if (!discussion) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    // Only author, course instructor, or admin can update
    const isAuthor = discussion.userId === session.user.id;
    const isInstructor = discussion.course.instructorId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isAuthor && !isInstructor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: Record<string, boolean> = {};
    if (typeof body.isPinned === "boolean") updateData.isPinned = body.isPinned;
    if (typeof body.isResolved === "boolean") updateData.isResolved = body.isResolved;

    const updated = await db.discussion.update({
      where: { id: discussionId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, image: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Discussion update error:", error);
    return NextResponse.json({ error: "Failed to update discussion" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { discussionId } = await params;
    const { content, parentId } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Verify discussion exists
    const discussion = await db.discussion.findUnique({
      where: { id: discussionId },
    });

    if (!discussion) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
    }

    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        discussionId,
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // Award XP for commenting
    await db.user.update({
      where: { id: session.user.id },
      data: { xp: { increment: 1 } },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Comment creation error:", error);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
