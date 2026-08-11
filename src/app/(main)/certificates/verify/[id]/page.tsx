import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import {
  CheckCircle,
  Calendar,
  GraduationCap,
  User,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { EduflowLogo } from "@/components/certificates/eduflow-logo";

export default async function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  const certificate = await db.certificate.findUnique({
    where: { certificateId: id },
    include: {
      user: { select: { name: true, image: true } },
      course: {
        select: {
          title: true,
          slug: true,
          instructor: { select: { name: true } },
        },
      },
    },
  });

  if (!certificate) {
    notFound();
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand/10 mb-4 shadow-[0_0_20px_rgba(0,255,204,0.15)]">
            <CheckCircle className="h-10 w-10 text-brand" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Certificate Verified
          </h1>
          <p className="text-text-secondary">
            This certificate is authentic and has been verified by EduFlow.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-brand/20 via-brand/10 to-surface-3 p-8 text-center border-b border-white/[0.06]">
            <div className="flex justify-center mb-3">
              <EduflowLogo size={48} />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">
              Certificate of Completion
            </h2>
            <p className="text-sm font-medium text-brand">
              EduFlow Learning Platform
            </p>
          </div>

          <CardContent className="py-8 px-6">
            <div className="text-center mb-8">
              <p className="text-sm text-text-secondary mb-2">This certifies that</p>
              <p className="text-2xl font-bold text-text-primary">
                {certificate.user.name}
              </p>
              <p className="text-sm text-text-secondary mt-4 mb-2">
                has successfully completed
              </p>
              <p className="text-xl font-semibold text-brand">
                {certificate.course.title}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                <User className="h-5 w-5 mx-auto mb-1 text-text-tertiary" />
                <p className="text-xs text-text-muted">Student</p>
                <p className="text-sm font-medium text-text-primary">
                  {certificate.user.name}
                </p>
              </div>
              <div className="text-center p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                <BookOpen className="h-5 w-5 mx-auto mb-1 text-text-tertiary" />
                <p className="text-xs text-text-muted">Instructor</p>
                <p className="text-sm font-medium text-text-primary">
                  {certificate.course.instructor.name}
                </p>
              </div>
              <div className="text-center p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                <GraduationCap className="h-5 w-5 mx-auto mb-1 text-text-tertiary" />
                <p className="text-xs text-text-muted">Grade</p>
                <p className="text-sm font-medium text-text-primary">
                  {certificate.grade.toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-3 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-text-tertiary" />
                <p className="text-xs text-text-muted">Issued</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatDate(certificate.issuedAt)}
                </p>
              </div>
            </div>

            <div className="text-center space-y-3">
              <Badge variant="info" size="md">
                Certificate ID: {certificate.certificateId}
              </Badge>
              <div>
                <Link
                  href={`/certificates/view/${encodeURIComponent(certificate.certificateId)}`}
                  className="text-sm text-brand hover:underline"
                >
                  View full certificate
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-2">
          <p className="text-xs text-text-muted max-w-md mx-auto">
            Anyone with this link can confirm the certificate is real. Employers
            and schools use Verify to check that a completion credential was
            issued by EduFlow.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-full border border-white/[0.10] text-white hover:border-brand/40 hover:text-brand transition-all"
          >
            Back to EduFlow
          </Link>
        </div>
      </div>
    </div>
  );
}
