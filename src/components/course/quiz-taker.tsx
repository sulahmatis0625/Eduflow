"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  Target,
  ChevronRight,
  RotateCcw,
  Award,
  Lock,
  ListChecks,
} from "lucide-react";

export interface QuizQuestion {
  id: string;
  text: string;
  type: string;
  options: string | null;
  points: number;
  order: number;
}

export interface QuizData {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  timeLimit: number | null;
  passingScore: number;
  maxAttempts: number;
  order: number;
  questions: QuizQuestion[];
  attempts: { id: string; score: number; passed: boolean; startedAt: string }[];
}

interface SubmitResult {
  score: number;
  passed: boolean;
  totalPoints: number;
  earnedPoints: number;
  courseCompleted?: boolean;
  certificateId?: string | null;
  attemptsRemaining?: number;
  questions: { id: string; correctAnswer: string; explanation: string | null }[];
}

interface QuizTakerProps {
  quiz: QuizData;
  courseSlug?: string;
  nextLessonHref?: string | null;
  nextQuizHref?: string | null;
  locked?: boolean;
  lockReason?: string;
  isFinalExam?: boolean;
  onSubmitted?: (result: SubmitResult) => void;
}

type Phase = "taking" | "score" | "review";

function parseOptions(options: string | null): string[] {
  if (!options) return [];
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QuizTaker({
  quiz,
  nextLessonHref,
  nextQuizHref,
  locked = false,
  lockReason,
  isFinalExam: isFinalExamProp,
  onSubmitted,
}: QuizTakerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("taking");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    quiz.timeLimit && quiz.timeLimit > 0 ? quiz.timeLimit * 60 : null
  );
  const [timedOut, setTimedOut] = useState(false);
  const submittingRef = useRef(false);
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const attemptsUsed = quiz.attempts.length;
  const attemptsLeft = Math.max(0, quiz.maxAttempts - attemptsUsed);
  const alreadyPassed = quiz.attempts.some((a) => a.passed);
  const bestScore = quiz.attempts.reduce(
    (best, a) => Math.max(best, a.score),
    0
  );
  const isFinalExam =
    isFinalExamProp ??
    (quiz.title.toLowerCase().includes("final") || quiz.order >= 99);

  const questions = quiz.questions;
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex >= questions.length - 1;
  const currentAnswer = currentQuestion
    ? (answers[currentQuestion.id] || "").trim()
    : "";
  const hasCurrentAnswer = currentAnswer.length > 0;

  const missedQuestions = useMemo(() => {
    if (!result) return [];
    return questions.filter((q) => {
      const review = result.questions.find((r) => r.id === q.id);
      const studentAnswer = (answers[q.id] || "").toLowerCase().trim();
      const correct = (review?.correctAnswer || "").toLowerCase().trim();
      return studentAnswer !== correct;
    });
  }, [result, questions, answers]);

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const submit = async (auto = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError("");
    setSubmitting(true);
    try {
      const currentAnswers = answersRef.current;
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          answers: Object.entries(currentAnswers).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit quiz");
        return;
      }
      if (auto) setTimedOut(true);
      setResult(data);
      setPhase("score");
      onSubmitted?.(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const goNext = () => {
    if (!hasCurrentAnswer || submitting) return;
    if (isLastQuestion) {
      void submit(false);
      return;
    }
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
  };

  useEffect(() => {
    if (
      locked ||
      phase !== "taking" ||
      !secondsLeft ||
      secondsLeft <= 0 ||
      attemptsLeft <= 0
    ) {
      return;
    }

    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          window.clearInterval(id);
          void submit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, phase, attemptsLeft, quiz.id]);

  const retry = () => {
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);
    setPhase("taking");
    setError("");
    setTimedOut(false);
    setSecondsLeft(
      quiz.timeLimit && quiz.timeLimit > 0 ? quiz.timeLimit * 60 : null
    );
  };

  if (locked) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-surface-1 p-8 text-center">
        <Lock className="h-10 w-10 mx-auto mb-3 text-text-muted" />
        <h2 className="text-lg font-semibold mb-2">Quiz locked</h2>
        <p className="text-sm text-text-tertiary max-w-md mx-auto">
          {lockReason ||
            "Complete all videos in this chapter before taking the quiz."}
        </p>
      </div>
    );
  }

  if (result && phase === "score") {
    const remaining =
      result.attemptsRemaining ?? Math.max(0, attemptsLeft - 1);

    return (
      <div className="space-y-6">
        <div
          className={`rounded-2xl border p-8 text-center ${
            result.passed
              ? "border-brand/30 bg-brand/10"
              : "border-red-500/20 bg-red-500/10"
          }`}
        >
          {result.passed ? (
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-brand" />
          ) : (
            <XCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
          )}
          <h2 className="text-2xl font-bold mb-1">
            {result.passed
              ? result.courseCompleted
                ? "Course complete!"
                : "You passed!"
              : timedOut
                ? "Time's up"
                : "Not quite yet"}
          </h2>
          <p className="text-4xl font-bold tabular-nums my-4 text-text-primary">
            {Math.round(result.score)}%
          </p>
          <p className="text-text-secondary mb-2">
            Passing: {quiz.passingScore}% · {result.earnedPoints}/
            {result.totalPoints} points
            {missedQuestions.length > 0
              ? ` · ${missedQuestions.length} missed`
              : " · Perfect score"}
          </p>
          <p className="text-xs text-text-muted mb-6">
            {result.passed
              ? remaining > 0
                ? `Passed — ${remaining} attempt${remaining === 1 ? "" : "s"} left if you want to improve.`
                : "Passed — no attempts remaining."
              : remaining > 0
                ? `${remaining} attempt${remaining === 1 ? "" : "s"} left. You need ${quiz.passingScore}% to pass.`
                : "No attempts remaining."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {missedQuestions.length > 0 && (
              <Button variant="outline" onClick={() => setPhase("review")}>
                <ListChecks className="h-4 w-4 mr-1" />
                Review missed questions
              </Button>
            )}
            {result.passed && result.courseCompleted && (
              <Link href="/dashboard/certificates">
                <Button variant="success">
                  <Award className="h-4 w-4 mr-1" /> View certificate
                </Button>
              </Link>
            )}
            {result.passed && nextQuizHref && !result.courseCompleted && (
              <Link href={nextQuizHref}>
                <Button>
                  Next quiz <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            )}
            {result.passed && nextLessonHref && !result.courseCompleted && (
              <Link href={nextLessonHref}>
                <Button variant={nextQuizHref ? "outline" : "primary"}>
                  Continue learning <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            )}
            {!result.passed && remaining > 0 && (
              <Button onClick={retry} variant="outline">
                <RotateCcw className="h-4 w-4 mr-1" /> Try again ({remaining}{" "}
                left)
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (result && phase === "review") {
    const remaining =
      result.attemptsRemaining ?? Math.max(0, attemptsLeft - 1);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Missed questions</h2>
            <p className="text-sm text-text-tertiary">
              {missedQuestions.length === 0
                ? "You got every question right."
                : `Review the ${missedQuestions.length} question${missedQuestions.length === 1 ? "" : "s"} you missed.`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setPhase("score")}>
            Back to score
          </Button>
        </div>

        {missedQuestions.length === 0 ? (
          <div className="rounded-xl border border-brand/20 bg-brand/10 p-6 text-center text-sm text-brand">
            Perfect — nothing to review.
          </div>
        ) : (
          <div className="space-y-3">
            {missedQuestions.map((q) => {
              const review = result.questions.find((r) => r.id === q.id);
              const studentAnswer = answers[q.id] || "";
              const qIndex = questions.findIndex((item) => item.id === q.id);

              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-red-500/15 bg-red-500/5 p-4"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium">
                      {qIndex + 1}. {q.text}
                    </p>
                  </div>
                  <p className="text-xs text-text-tertiary ml-6">
                    Your answer:{" "}
                    <span className="text-text-secondary">
                      {studentAnswer || "—"}
                    </span>
                  </p>
                  <p className="text-xs text-brand ml-6 mt-1">
                    Correct: {review?.correctAnswer || "—"}
                  </p>
                  {review?.explanation && (
                    <p className="text-xs text-text-muted ml-6 mt-1">
                      {review.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => setPhase("score")}>
            Back to score
          </Button>
          {!result.passed && remaining > 0 && (
            <Button onClick={retry}>
              <RotateCcw className="h-4 w-4 mr-1" /> Try again
            </Button>
          )}
          {result.passed && nextLessonHref && (
            <Link href={nextLessonHref}>
              <Button>
                Continue learning <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  const timerUrgent = secondsLeft !== null && secondsLeft <= 60;
  const progressPct =
    questions.length > 0
      ? ((currentIndex + (hasCurrentAnswer ? 1 : 0)) / questions.length) * 100
      : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/[0.06] bg-surface-1 p-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="warning">
            {isFinalExam ? "Final exam" : "Chapter quiz"}
          </Badge>
          {alreadyPassed && <Badge variant="success">Passed</Badge>}
          {quiz.timeLimit ? (
            <span className="text-xs text-text-tertiary flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {quiz.timeLimit} min limit
            </span>
          ) : null}
          <span className="text-xs text-text-tertiary flex items-center gap-1">
            <Target className="h-3.5 w-3.5" /> Pass {quiz.passingScore}%
          </span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-sm text-text-secondary mb-3">
                {quiz.description}
              </p>
            )}
            <p className="text-xs text-text-muted">
              Question {Math.min(currentIndex + 1, questions.length)} of{" "}
              {questions.length} ·{" "}
              <span className={attemptsLeft <= 1 ? "text-amber-300" : ""}>
                {attemptsLeft} of {quiz.maxAttempts} attempt
                {quiz.maxAttempts === 1 ? "" : "s"} left
              </span>
              {attemptsUsed > 0 ? ` · Best score ${Math.round(bestScore)}%` : ""}
            </p>
          </div>
          {secondsLeft !== null && attemptsLeft > 0 && (
            <div
              className={`rounded-xl border px-4 py-2 text-center min-w-[88px] ${
                timerUrgent
                  ? "border-red-500/40 bg-red-500/10 text-red-300"
                  : "border-white/[0.08] bg-surface-0 text-text-primary"
              }`}
            >
              <p className="text-[10px] uppercase tracking-wide text-text-muted">
                Time left
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {formatTime(secondsLeft)}
              </p>
            </div>
          )}
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-300"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      </div>

      {attemptsLeft <= 0 && !alreadyPassed ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          You&apos;ve used all {quiz.maxAttempts} attempts for this quiz. Ask
          your instructor if you need more.
        </div>
      ) : alreadyPassed && attemptsLeft <= 0 ? (
        <div className="rounded-xl border border-brand/20 bg-brand/10 p-4 text-sm text-brand">
          You already passed this quiz (best score {Math.round(bestScore)}%). No
          attempts left to retake.
        </div>
      ) : !currentQuestion ? (
        <div className="rounded-xl border border-white/[0.06] p-4 text-sm text-text-tertiary">
          This quiz has no questions yet.
        </div>
      ) : (
        <>
          {alreadyPassed && (
            <div className="rounded-xl border border-brand/20 bg-brand/10 p-3 text-xs text-brand">
              You already passed (best {Math.round(bestScore)}%). Retaking uses
              another attempt — {attemptsLeft} left.
            </div>
          )}

          <div className="rounded-xl border border-white/[0.06] bg-surface-1 p-5 sm:p-6">
            <p className="text-xs text-text-muted mb-2">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <p className="text-base font-medium mb-4">
              {currentQuestion.text}
              <span className="text-text-muted font-normal ml-2 text-sm">
                ({currentQuestion.points} pt
                {currentQuestion.points === 1 ? "" : "s"})
              </span>
            </p>

            {currentQuestion.type === "SHORT_ANSWER" &&
            parseOptions(currentQuestion.options).length === 0 ? (
              <input
                type="text"
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                className="w-full h-10 rounded-lg bg-surface-0 border border-white/[0.08] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Type your answer"
              />
            ) : (
              <div className="space-y-2">
                {(parseOptions(currentQuestion.options).length > 0
                  ? parseOptions(currentQuestion.options)
                  : ["True", "False"]
                ).map((option) => {
                  const selected = answers[currentQuestion.id] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAnswer(currentQuestion.id, option)}
                      className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                        selected
                          ? "border-brand bg-brand/15 text-brand"
                          : "border-white/[0.06] hover:border-white/[0.12] text-text-secondary"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-text-muted">
              {hasCurrentAnswer
                ? isLastQuestion
                  ? "Last question — submit to see your score"
                  : "Choose Next to continue"
                : "Select an answer to continue"}
            </p>
            <Button
              onClick={goNext}
              disabled={!hasCurrentAnswer || submitting || attemptsLeft <= 0}
              isLoading={submitting && isLastQuestion}
            >
              {isLastQuestion ? (
                "Submit quiz"
              ) : (
                <>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
