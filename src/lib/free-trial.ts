import { db } from "@/lib/db";

/** Primary free-trial course (landing CTA). */
export const FREE_TRIAL_COURSE_SLUG = "html-tutorial-for-beginners";

/**
 * Enroll a student in published free courses (free trial / starter catalog).
 * Prefers the HTML Tutorial for Beginners trial course; also enrolls any other free courses.
 * Safe to call multiple times — skips courses already enrolled.
 */
export async function enrollUserInFreeCourses(userId: string) {
  const freeCourses = await db.course.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { slug: FREE_TRIAL_COURSE_SLUG },
        { isFree: true },
        { price: 0 },
      ],
    },
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  // Put the named trial course first
  freeCourses.sort((a, b) => {
    if (a.slug === FREE_TRIAL_COURSE_SLUG) return -1;
    if (b.slug === FREE_TRIAL_COURSE_SLUG) return 1;
    return 0;
  });

  if (freeCourses.length === 0) {
    return { enrolled: [] as { id: string; title: string }[], skipped: 0 };
  }

  const existing = await db.enrollment.findMany({
    where: {
      userId,
      courseId: { in: freeCourses.map((c) => c.id) },
    },
    select: { courseId: true },
  });
  const already = new Set(existing.map((e) => e.courseId));

  const toEnroll = freeCourses.filter((c) => !already.has(c.id));
  const enrolled: { id: string; title: string }[] = [];

  for (const course of toEnroll) {
    await db.enrollment.create({
      data: {
        userId,
        courseId: course.id,
        status: "ACTIVE",
        approvedAt: new Date(),
      },
    });
    enrolled.push({ id: course.id, title: course.title });
  }

  if (enrolled.length > 0) {
    await db.user.update({
      where: { id: userId },
      data: { xp: { increment: 10 * enrolled.length } },
    });

    const titles = enrolled.map((c) => c.title).join(", ");
    await db.notification.create({
      data: {
        userId,
        title: "Free trial course added!",
        message:
          enrolled.length === 1
            ? `"${titles}" is now in your My Courses list. Start learning anytime.`
            : `These free courses are now in My Courses: ${titles}.`,
        type: "SUCCESS",
        link: "/dashboard/courses",
      },
    });
  }

  return { enrolled, skipped: already.size };
}
