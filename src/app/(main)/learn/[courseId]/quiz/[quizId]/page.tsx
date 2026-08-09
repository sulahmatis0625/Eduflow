"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuizTaker, type QuizData } from "@/components/course/quiz-taker";
import { ChevronLeft, BookOpen } from "lucide-react";

interface CourseQuizMeta {
  id: string;
  order: number;
  title: string;
}

interface LearnLite {
  id: string;
  title: string;
  slug: string;
  sections: {
    order: number;
    lessons: { id: string; order: number }[];
  }[];
  quizzes: {
    id: string;
    title: string;
    order: number;
    unlocked: boolean;
    passed: boolean;
  }[];
}

export default function CourseQuizPage({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
}) {
  const router = useRouter();
  const [resolved, setResolved] = useState<{
    courseId: string;
    quizId: string;
  } | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [course, setCourse] = useState<LearnLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [lockReason, setLockReason] = useState<string | null>(null);

  useEffect(() => {
    params.then(setResolved);
  }, [params]);

  useEffect(() => {
    if (!resolved) return;

    async function load() {
      try {
        const [quizRes, learnRes] = await Promise.all([
          fetch(`/api/quiz?quizId=${resolved!.quizId}`),
          fetch(`/api/courses/${resolved!.courseId}/learn`),
        ]);

        if (quizRes.status === 401 || learnRes.status === 401) {
          router.push("/login");
          return;
        }
        if (learnRes.status === 403) {
          router.push("/courses");
          return;
        }

        if (quizRes.status === 403) {
          const err = await quizRes.json();
          setLockReason(err.error || "This quiz is locked.");
        }

        if (quizRes.ok) {
          const quizData = await quizRes.json();
          if (!quizData) {
            setLoading(false);
            return;
          }
          if (quizData.courseId !== resolved!.courseId) {
            router.push(`/learn/${quizData.courseId}/quiz/${quizData.id}`);
            return;
          }
          setQuiz(quizData);
        }

        if (learnRes.ok) {
          setCourse(await learnRes.json());
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [resolved, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0">
        <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!quiz && !lockReason) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0 text-text-primary">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-text-tertiary" />
          <h2 className="text-xl font-semibold mb-2">Quiz not found</h2>
          <Link href="/dashboard/courses">
            <Button>My Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const quizzes = (course?.quizzes || []) as CourseQuizMeta[];
  const quizMeta = course?.quizzes?.find((q) => q.id === quiz?.id);
  const locked = Boolean(lockReason) || quizMeta?.unlocked === false;
  const maxQuizOrder = quizzes.reduce((m, q) => Math.max(m, q.order), 0);
  const isFinalExam = Boolean(quiz && maxQuizOrder > 0 && quiz.order === maxQuizOrder);

  const nextSection = course?.sections?.find(
    (s) => quiz && s.order === quiz.order + 1
  );
  const nextLessonId = nextSection?.lessons?.[0]?.id;

  const firstLessonId = course?.sections?.[0]?.lessons?.[0]?.id;
  const backHref = firstLessonId
    ? `/learn/${resolved?.courseId}/${firstLessonId}`
    : "/dashboard/courses";

  return (
    <div className="min-h-screen bg-surface-0 text-text-primary">
      <div className="h-14 border-b border-white/[0.06] bg-surface-1 flex items-center px-4 gap-3">
        <Link
          href={backHref}
          className="p-1.5 rounded-lg hover:bg-white/[0.03] transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {course?.title || "Course quiz"}
          </p>
          <p className="text-xs text-text-muted truncate">
            {quiz?.title || "Assessment"}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {quiz ? (
          <QuizTaker
            quiz={quiz}
            isFinalExam={isFinalExam}
            locked={locked}
            lockReason={
              lockReason ||
              "Complete all videos in this chapter before taking the quiz."
            }
            nextLessonHref={
              nextLessonId
                ? `/learn/${resolved?.courseId}/${nextLessonId}`
                : firstLessonId
                  ? `/learn/${resolved?.courseId}/${firstLessonId}`
                  : null
            }
            onSubmitted={() => {
              // Refresh attempt counts / unlock state after submit
              if (resolved) {
                fetch(`/api/quiz?quizId=${resolved.quizId}`)
                  .then((r) => r.json())
                  .then(setQuiz)
                  .catch(() => {});
                fetch(`/api/courses/${resolved.courseId}/learn`)
                  .then((r) => r.json())
                  .then(setCourse)
                  .catch(() => {});
              }
            }}
          />
        ) : (
          <QuizTaker
            quiz={{
              id: resolved?.quizId || "",
              title: "Locked quiz",
              description: null,
              courseId: resolved?.courseId || "",
              timeLimit: null,
              passingScore: 50,
              maxAttempts: 3,
              order: 0,
              questions: [],
              attempts: [],
            }}
            locked
            lockReason={
              lockReason ||
              "Complete all videos in this chapter before taking the quiz."
            }
          />
        )}

        {quizzes.length > 1 && (
          <div className="mt-10 pt-6 border-t border-white/[0.06]">
            <p className="text-xs text-text-muted mb-3 uppercase tracking-wide">
              Course assessments
            </p>
            <div className="space-y-2">
              {course?.quizzes?.map((q) => (
                <Link
                  key={q.id}
                  href={
                    q.unlocked
                      ? `/learn/${resolved?.courseId}/quiz/${q.id}`
                      : "#"
                  }
                  onClick={(e) => {
                    if (!q.unlocked) e.preventDefault();
                  }}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                    q.id === quiz?.id
                      ? "border-brand/40 bg-brand/10 text-brand"
                      : q.unlocked
                        ? "border-white/[0.06] hover:bg-white/[0.03]"
                        : "border-white/[0.04] text-text-muted opacity-60 cursor-not-allowed"
                  }`}
                >
                  <span>{q.title}</span>
                  <span className="text-xs">
                    {q.passed ? "Passed" : q.unlocked ? "Open" : "Locked"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
