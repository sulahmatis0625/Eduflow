import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    const reviews = await db.review.findMany({
      where: { courseId, isApproved: true },
      include: {
        user: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;
    const { rating, comment } = await req.json();

    // Check enrollment
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Must be enrolled to review" }, { status: 403 });
    }

    const review = await db.review.upsert({
      where: { userId_courseId: { userId: session.user.id, courseId } },
      update: { rating, comment },
      create: {
        userId: session.user.id,
        courseId,
        rating,
        comment,
      },
    });

    // Award XP
    await db.user.update({
      where: { id: session.user.id },
      data: { xp: { increment: 5 } },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Review creation error:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
