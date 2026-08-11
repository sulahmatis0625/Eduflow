import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CertificateDocument } from "@/components/certificates/certificate-document";

export const metadata = {
  title: "View Certificate | EduFlow",
};

export default async function CertificateViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  const certificate = await db.certificate.findUnique({
    where: { certificateId: id },
    include: {
      user: { select: { name: true } },
      course: {
        select: {
          title: true,
          instructor: { select: { name: true } },
        },
      },
    },
  });

  if (!certificate) {
    notFound();
  }

  return (
    <div className="min-h-[80vh] py-10 px-4">
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Certificate</h1>
          <p className="text-sm text-text-secondary">
            Preview only — no download required
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/certificates/verify/${encodeURIComponent(id)}`}
            className="inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-full border border-white/[0.10] text-white hover:border-brand/40 hover:text-brand transition-all"
          >
            Verify authenticity
          </Link>
          <Link
            href="/dashboard/certificates"
            className="inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-full text-white hover:bg-white/[0.05] transition-all"
          >
            Back
          </Link>
        </div>
      </div>

      <CertificateDocument
        data={{
          certificateId: certificate.certificateId,
          studentName: certificate.user.name || "Student",
          courseTitle: certificate.course.title,
          instructorName: certificate.course.instructor.name || "Instructor",
          grade: certificate.grade,
          issuedAt: certificate.issuedAt,
        }}
      />
    </div>
  );
}
