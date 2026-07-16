import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const users = await db.user.findMany({
      where: { isActive: true, role: "STUDENT" },
      select: {
        id: true,
        name: true,
        image: true,
        xp: true,
        level: true,
        _count: {
          select: {
            achievements: true,
            certificates: true,
            enrollments: true,
          },
        },
      },
      orderBy: { xp: "desc" },
      take: 100,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
