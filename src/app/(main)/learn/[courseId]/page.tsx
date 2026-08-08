import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** `/learn/[courseId]` → first unlocked lesson (fixes slug-only / missing lesson links). */
export default async function LearnCourseIndexPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { courseId } = await params;

  // Accept real id, or resolve slug for older links
  let course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" }, take: 1 },
        },
      },
    },
  });

  if (!course) {
    course = await db.course.findUnique({
      where: { slug: courseId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            lessons: { orderBy: { order: "asc" }, take: 1 },
          },
        },
      },
    });
  }

  if (!course) notFound();

  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId: course.id },
    },
  });

  if (!enrollment || !["ACTIVE", "COMPLETED", "APPROVED"].includes(enrollment.status)) {
    redirect(`/courses/${course.slug}`);
  }

  const firstLesson = course.sections.find((s) => s.lessons.length > 0)?.lessons[0];
  if (!firstLesson) {
    redirect(`/courses/${course.slug}`);
  }

  redirect(`/learn/${course.id}/${firstLesson.id}`);
}
