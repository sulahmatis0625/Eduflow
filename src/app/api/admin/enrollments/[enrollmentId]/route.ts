import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enrollmentId } = await params;
    const { status } = await req.json();

    const enrollment = await db.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status,
        ...(status === "APPROVED" || status === "ACTIVE"
          ? { approvedAt: new Date(), approvedBy: session.user.id }
          : {}),
      },
      include: { course: true },
    });

    await db.notification.create({
      data: {
        userId: enrollment.userId,
        title:
          status === "APPROVED" || status === "ACTIVE"
            ? "Enrollment Approved!"
            : "Enrollment Update",
        message:
          status === "APPROVED" || status === "ACTIVE"
            ? `Your enrollment in "${enrollment.course.title}" has been approved!`
            : `Your enrollment in "${enrollment.course.title}" has been updated to ${status.toLowerCase()}.`,
        type:
          status === "APPROVED" || status === "ACTIVE" ? "SUCCESS" : "WARNING",
        link: `/courses/${enrollment.course.slug}`,
      },
    });

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("Admin enrollment update error:", error);
    return NextResponse.json(
      { error: "Failed to update enrollment" },
      { status: 500 }
    );
  }
}
