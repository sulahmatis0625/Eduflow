import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Generate certificate
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await req.json();

    // Check enrollment is completed
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
    });

    if (!enrollment || enrollment.status !== "COMPLETED") {
      return NextResponse.json({ error: "Course not completed" }, { status: 400 });
    }

    // Check if certificate already exists
    const existing = await db.certificate.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // Check passing grade
    const course = await db.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!course.certificateEnabled) {
      return NextResponse.json({ error: "Certificates not available for this course" }, { status: 400 });
    }

    const grade = enrollment.grade || 0;
    if (grade < course.passingGrade) {
      return NextResponse.json({
        error: `Grade ${grade.toFixed(1)}% is below the required ${course.passingGrade}%`,
        grade,
        required: course.passingGrade,
      }, { status: 400 });
    }

    // Generate unique certificate ID
    const certificateId = `EF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const certificate = await db.certificate.create({
      data: {
        userId: session.user.id,
        courseId,
        certificateId,
        grade,
      },
    });

    // Award XP for certificate
    await db.user.update({
      where: { id: session.user.id },
      data: { xp: { increment: 100 } },
    });

    await db.notification.create({
      data: {
        userId: session.user.id,
        title: "Certificate Earned!",
        message: `Congratulations! You've earned a certificate for "${course.title}"!`,
        type: "ACHIEVEMENT",
        link: `/dashboard/certificates`,
      },
    });

    return NextResponse.json(certificate);
  } catch (error) {
    console.error("Certificate generation error:", error);
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 });
  }
}

// Verify certificate
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const certId = searchParams.get("id");

    if (!certId) {
      return NextResponse.json({ error: "Certificate ID required" }, { status: 400 });
    }

    const certificate = await db.certificate.findUnique({
      where: { certificateId: certId },
      include: {
        user: { select: { name: true, image: true } },
        course: { select: { title: true, instructor: { select: { name: true } } } },
      },
    });

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json(certificate);
  } catch (error) {
    console.error("Certificate verify error:", error);
    return NextResponse.json({ error: "Failed to verify certificate" }, { status: 500 });
  }
}
