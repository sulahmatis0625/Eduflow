import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;

    // Check enrollment
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
    });

    if (!enrollment || !["ACTIVE", "COMPLETED"].includes(enrollment.status)) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { name: true, image: true } },
        sections: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Get completed lessons
    const allLessonIds = course.sections.flatMap((s) => s.lessons.map((l) => l.id));
    const completedProgress = await db.lessonProgress.findMany({
      where: {
        userId: session.user.id,
        lessonId: { in: allLessonIds },
        completed: true,
      },
      select: { lessonId: true },
    });

    return NextResponse.json({
      ...course,
      enrollment: { progress: enrollment.progress, status: enrollment.status },
      completedLessons: completedProgress.map((p) => p.lessonId),
    });
  } catch (error) {
    console.error("Learn fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}
