import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.isFeatured !== undefined) data.isFeatured = body.isFeatured;

    const course = await db.course.update({
      where: { id: courseId },
      data: data as any,
    });

    // Notify instructor about status change
    if (body.status) {
      await db.notification.create({
        data: {
          userId: course.instructorId,
          title: `Course ${body.status.toLowerCase()}`,
          message: `Your course "${course.title}" has been ${body.status.toLowerCase()} by admin.`,
          type: body.status === "PUBLISHED" ? "SUCCESS" : "WARNING",
        },
      });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Admin course update error:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}
