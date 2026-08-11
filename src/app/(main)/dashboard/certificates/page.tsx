import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, getGradeLabel, getGradeColor } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Award, GraduationCap, Calendar } from "lucide-react";
import { CertificateActions } from "@/components/dashboard/certificate-actions";

export const metadata = {
  title: "My Certificates | EduFlow",
};

export default async function CertificatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;

  const certificates = await db.certificate.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
        },
      },
    },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          My Certificates
        </h1>
        <p className="text-text-secondary mt-1">
          Your earned certificates of completion
        </p>
      </div>

      {certificates.length === 0 ? (
        <EmptyState
          icon={<Award className="h-16 w-16" />}
          title="No certificates yet"
          description="Complete a course to earn your first certificate. Certificates are awarded upon successful course completion."
          action={
            <Link href="/courses">
              <Button>Browse Courses</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} hover>
              {/* Certificate visual header */}
              <div className="relative bg-gradient-to-br from-brand/20 via-brand/10 to-surface-3 px-6 py-8 rounded-t-xl text-center border-b border-white/[0.06]">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-2 left-2 w-16 h-16 border-2 border-brand/30 rounded-full" />
                  <div className="absolute bottom-2 right-2 w-12 h-12 border-2 border-brand/30 rounded-full" />
                </div>
                <GraduationCap className="h-10 w-10 text-brand/80 mx-auto mb-2" />
                <p className="text-sm font-medium text-brand">
                  Certificate of Completion
                </p>
                <h3 className="text-lg font-bold text-text-primary mt-2 line-clamp-2">
                  {cert.course.title}
                </h3>
              </div>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Calendar className="h-4 w-4" />
                    {formatDate(cert.issuedAt)}
                  </div>
                  <Badge
                    variant={cert.grade >= 90 ? "success" : cert.grade >= 70 ? "info" : "warning"}
                    size="md"
                  >
                    <span className={getGradeColor(cert.grade)}>
                      {getGradeLabel(cert.grade)}
                    </span>
                    <span className="ml-1 opacity-70">
                      ({Math.round(cert.grade)}%)
                    </span>
                  </Badge>
                </div>

                <div className="text-xs text-text-tertiary font-mono">
                  ID: {cert.certificateId}
                </div>
              </CardContent>

              <CardFooter>
                <CertificateActions certificateId={cert.certificateId} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
