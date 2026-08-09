import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { buildCertificatePdf } from "@/lib/certificate-pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  try {
    const session = await auth();
    const { certificateId } = await params;

    const certificate = await db.certificate.findUnique({
      where: { certificateId },
      include: {
        user: { select: { id: true, name: true } },
        course: {
          select: {
            title: true,
            instructor: { select: { name: true } },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Owner or admin can download; public verify page is separate
    const isOwner = session?.user?.id === certificate.userId;
    const isAdmin = session?.user?.role === "ADMIN";
    if (!session?.user || (!isOwner && !isAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bytes = await buildCertificatePdf({
      certificateId: certificate.certificateId,
      studentName: certificate.user.name || "Student",
      courseTitle: certificate.course.title,
      instructorName: certificate.course.instructor.name || "Instructor",
      grade: certificate.grade,
      issuedAt: certificate.issuedAt,
    });

    const safeName = certificate.course.title
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60);

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="EduFlow-${safeName}-${certificate.certificateId}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Certificate download error:", error);
    return NextResponse.json(
      { error: "Failed to download certificate" },
      { status: 500 }
    );
  }
}
