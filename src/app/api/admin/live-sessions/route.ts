import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const sessions = await db.liveSession.findMany({
      where: where as any,
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { attendance: true } },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Admin live sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch live sessions" }, { status: 500 });
  }
}
