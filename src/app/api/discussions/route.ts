import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId required" }, { status: 400 });
    }

    const discussions = await db.discussion.findMany({
      where: { courseId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        comments: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { comments: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(discussions);
  } catch (error) {
    console.error("Discussions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch discussions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, title, content } = await req.json();

    const discussion = await db.discussion.create({
      data: {
        title,
        content,
        userId: session.user.id,
        courseId,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // Award XP
    await db.user.update({
      where: { id: session.user.id },
      data: { xp: { increment: 3 } },
    });

    return NextResponse.json(discussion);
  } catch (error) {
    console.error("Discussion creation error:", error);
    return NextResponse.json({ error: "Failed to create discussion" }, { status: 500 });
  }
}
