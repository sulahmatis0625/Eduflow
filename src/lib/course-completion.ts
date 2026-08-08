import { db } from "@/lib/db";

/** Active quizzes for a course, sorted by order. */
export async function getActiveCourseQuizzes(courseId: string) {
  return db.quiz.findMany({
    where: { courseId, isActive: true },
    select: { id: true, order: true, title: true },
    orderBy: { order: "asc" },
  });
}

/** Final exam = highest-order active quiz (convention: N+1 after chapters). */
export function getFinalQuizOrder(
  quizzes: { order: number }[],
  maxSectionOrder: number
): number | null {
  if (quizzes.length === 0) return null;
  const maxQuizOrder = quizzes.reduce((m, q) => Math.max(m, q.order), 0);
  // Prefer N+1 if present; otherwise highest quiz order
  if (maxSectionOrder > 0 && quizzes.some((q) => q.order === maxSectionOrder + 1)) {
    return maxSectionOrder + 1;
  }
  return maxQuizOrder;
}

/**
 * When the course has active quizzes, lesson completion alone must not certify.
 * Certificate requires the final quiz to be passed.
 */
export async function courseRequiresFinalQuiz(courseId: string): Promise<boolean> {
  const count = await db.quiz.count({
    where: { courseId, isActive: true },
  });
  return count > 0;
}

export function isFinalQuiz(
  quizOrder: number,
  quizzes: { order: number }[]
): boolean {
  if (quizzes.length === 0) return false;
  const maxOrder = quizzes.reduce((m, q) => Math.max(m, q.order), 0);
  return quizOrder === maxOrder;
}
