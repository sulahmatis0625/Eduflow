import { db } from "@/lib/db";

/**
 * Issue a certificate when a course is completed (idempotent).
 * Uses enrollment grade, or defaults to 100 when lessons are fully completed.
 */
export async function issueCertificateIfEligible(
  userId: string,
  courseId: string,
  gradeHint?: number | null
) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      passingGrade: true,
      certificateEnabled: true,
    },
  });

  if (!course?.certificateEnabled) {
    return null;
  }

  const existing = await db.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) {
    return existing;
  }

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment || enrollment.status !== "COMPLETED") {
    return null;
  }

  const grade =
    gradeHint ??
    enrollment.grade ??
    100;

  if (grade < course.passingGrade) {
    return null;
  }

  // Persist grade if enrollment had none (lesson-only completion)
  if (enrollment.grade == null) {
    await db.enrollment.update({
      where: { id: enrollment.id },
      data: { grade },
    });
  }

  const certificateId = `EF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const certificate = await db.certificate.create({
    data: {
      userId,
      courseId,
      certificateId,
      grade,
    },
  });

  await db.user.update({
    where: { id: userId },
    data: { xp: { increment: 100 } },
  });

  await db.notification.create({
    data: {
      userId,
      title: "Certificate Earned!",
      message: `Congratulations! You've earned a certificate for "${course.title}"!`,
      type: "ACHIEVEMENT",
      link: "/dashboard/certificates",
    },
  });

  return certificate;
}
