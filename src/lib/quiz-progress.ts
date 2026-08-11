/** Quiz progress / unlock helpers.
 * Chapter quizzes use `order` matching section order (1..N).
 * Final exam is the quiz with the highest order (typically N+1).
 *
 * A quiz unlocks only when:
 * 1) All lessons for its chapter are completed (final = all course lessons), and
 * 2) The previous quiz in sequence was passed (if any).
 */

export type QuizPassInfo = {
  id: string;
  order: number;
  passed: boolean;
};

export type SectionLessonMap = {
  order: number;
  lessonIds: string[];
};

export type QuizUnlockContext = {
  maxSectionOrder: number;
  sections: SectionLessonMap[];
  completedLessonIds: Set<string> | string[];
};

function toCompletedSet(
  completedLessonIds: Set<string> | string[]
): Set<string> {
  return completedLessonIds instanceof Set
    ? completedLessonIds
    : new Set(completedLessonIds);
}

/** True when every lesson in the section is marked complete. */
export function areSectionLessonsComplete(
  sectionOrder: number,
  sections: SectionLessonMap[],
  completedLessonIds: Set<string> | string[]
): boolean {
  const section = sections.find((s) => s.order === sectionOrder);
  if (!section || section.lessonIds.length === 0) return false;
  const completed = toCompletedSet(completedLessonIds);
  return section.lessonIds.every((id) => completed.has(id));
}

/** True when every lesson in the course is marked complete. */
export function areAllCourseLessonsComplete(
  sections: SectionLessonMap[],
  completedLessonIds: Set<string> | string[]
): boolean {
  const allIds = sections.flatMap((s) => s.lessonIds);
  if (allIds.length === 0) return false;
  const completed = toCompletedSet(completedLessonIds);
  return allIds.every((id) => completed.has(id));
}

/**
 * Whether chapter videos required for this quiz are done.
 * Chapter quiz (order <= maxSectionOrder): that section's lessons.
 * Final (order > maxSectionOrder): all course lessons.
 */
export function areQuizLessonsComplete(
  quizOrder: number,
  ctx: QuizUnlockContext
): boolean {
  if (ctx.maxSectionOrder > 0 && quizOrder > ctx.maxSectionOrder) {
    return areAllCourseLessonsComplete(ctx.sections, ctx.completedLessonIds);
  }
  return areSectionLessonsComplete(
    quizOrder,
    ctx.sections,
    ctx.completedLessonIds
  );
}

/** Previous quiz in sequence must be passed (if one exists). */
export function isPreviousQuizPassed(
  quizOrder: number,
  quizzes: QuizPassInfo[]
): boolean {
  if (quizOrder <= 1) return true;
  const previous = quizzes.find((q) => q.order === quizOrder - 1);
  if (!previous) return true;
  return previous.passed;
}

/**
 * Quiz is unlocked when chapter lessons are complete and the previous quiz was passed.
 */
export function isQuizUnlocked(
  quizOrder: number,
  quizzes: QuizPassInfo[],
  ctx?: QuizUnlockContext
): boolean {
  if (!isPreviousQuizPassed(quizOrder, quizzes)) return false;
  if (!ctx) return true;
  return areQuizLessonsComplete(quizOrder, ctx);
}

/** Section S (order > 1) unlocks only after quiz order S-1 is passed. */
export function isSectionUnlocked(
  sectionOrder: number,
  quizzes: QuizPassInfo[]
): boolean {
  if (sectionOrder <= 1) return true;
  const gateQuiz = quizzes.find((q) => q.order === sectionOrder - 1);
  if (!gateQuiz) return true;
  return gateQuiz.passed;
}

export function findNextQuizAfterPass(
  currentOrder: number,
  quizzes: { id: string; order: number }[]
): { id: string; order: number } | null {
  const sorted = [...quizzes].sort((a, b) => a.order - b.order);
  return sorted.find((q) => q.order > currentOrder) ?? null;
}

export function quizLockReason(
  quizOrder: number,
  quizzes: QuizPassInfo[],
  ctx: QuizUnlockContext
): string {
  if (!areQuizLessonsComplete(quizOrder, ctx)) {
    if (ctx.maxSectionOrder > 0 && quizOrder > ctx.maxSectionOrder) {
      return "Complete every lesson in the course before taking the final exam.";
    }
    return "Complete all videos in this chapter before taking the quiz.";
  }
  if (!isPreviousQuizPassed(quizOrder, quizzes)) {
    return "Pass the previous chapter quiz to unlock this assessment.";
  }
  return "This quiz is locked.";
}
