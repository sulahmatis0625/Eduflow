"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  QuizQuestionEditor,
  EMPTY_QUESTION,
  validateQuizQuestions,
  serializeQuizQuestions,
  type QuizQuestionDraft,
} from "@/components/dashboard/quiz-question-editor";
import {
  HelpCircle,
  Plus,
  X,
  Loader2,
  Trash2,
  Clock,
  Target,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Users,
  Award,
} from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  timeLimit: number | null;
  passingScore: number;
  maxAttempts: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  isFinal?: boolean;
  sectionTitle?: string | null;
  sectionOrder?: number | null;
  _count: {
    questions: number;
    attempts: number;
  };
}

interface SectionOption {
  id: string;
  title: string;
  order: number;
}

interface ClassroomQuizzesProps {
  courseId: string;
}

export function ClassroomQuizzes({ courseId }: ClassroomQuizzesProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [maxSectionOrder, setMaxSectionOrder] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [passingScore, setPassingScore] = useState("50");
  const [maxAttempts, setMaxAttempts] = useState("3");
  const [placement, setPlacement] = useState<"chapter" | "final">("chapter");
  const [sectionOrder, setSectionOrder] = useState("");

  const [questions, setQuestions] = useState<QuizQuestionDraft[]>([
    { ...EMPTY_QUESTION },
  ]);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  async function fetchQuizzes() {
    try {
      const res = await fetch(`/api/classrooms/${courseId}/quizzes`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(Array.isArray(data) ? data : data.quizzes || []);
        setSections(data.sections || []);
        setMaxSectionOrder(data.maxSectionOrder || 0);
        if (!sectionOrder && data.sections?.length) {
          const taken = new Set(
            (data.quizzes || []).map((q: Quiz) => q.order)
          );
          const free = data.sections.find(
            (s: SectionOption) => !taken.has(s.order)
          );
          setSectionOrder(String(free?.order ?? data.sections[0].order));
        }
      }
    } catch {
      console.error("Failed to fetch quizzes");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setShowForm(false);
    setStep(1);
    setTitle("");
    setDescription("");
    setTimeLimit("");
    setPassingScore("50");
    setMaxAttempts("3");
    setPlacement("chapter");
    setQuestions([{ ...EMPTY_QUESTION }]);
    setError("");
    const taken = new Set(quizzes.map((q) => q.order));
    const free = sections.find((s) => !taken.has(s.order));
    setSectionOrder(String(free?.order ?? sections[0]?.order ?? ""));
  }

  function goToStep2() {
    setError("");
    if (!title.trim()) {
      setError("Quiz title is required.");
      return;
    }
    if (sections.length === 0) {
      setError("Add chapters/lessons before creating quizzes.");
      return;
    }
    if (placement === "chapter" && !sectionOrder) {
      setError("Select a chapter for this quiz.");
      return;
    }
    if (placement === "final") {
      const hasFinal = quizzes.some(
        (q) => q.isFinal || q.order === maxSectionOrder + 1
      );
      if (hasFinal) {
        setError("A final exam already exists. Delete it first to replace.");
        return;
      }
    } else {
      const order = parseInt(sectionOrder, 10);
      if (quizzes.some((q) => q.order === order)) {
        setError("This chapter already has a quiz.");
        return;
      }
    }
    setStep(2);
  }

  async function handleSubmit() {
    setError("");
    const validation = validateQuizQuestions(questions);
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/classrooms/${courseId}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          timeLimit: timeLimit ? parseInt(timeLimit, 10) : undefined,
          passingScore: passingScore ? parseFloat(passingScore) : 50,
          maxAttempts: maxAttempts ? parseInt(maxAttempts, 10) : 3,
          isFinal: placement === "final",
          sectionOrder:
            placement === "chapter" ? parseInt(sectionOrder, 10) : undefined,
          questions: serializeQuizQuestions(questions),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create quiz.");
        return;
      }

      await fetchQuizzes();
      resetForm();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(quiz: Quiz) {
    setTogglingId(quiz.id);
    try {
      const res = await fetch(
        `/api/classrooms/${courseId}/quizzes/${quiz.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !quiz.isActive }),
        }
      );

      if (res.ok) {
        const updated = await res.json();
        setQuizzes((prev) =>
          prev.map((q) =>
            q.id === updated.id ? { ...q, isActive: updated.isActive } : q
          )
        );
      }
    } catch {
      console.error("Failed to toggle quiz");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(quizId: string) {
    setDeletingId(quizId);
    try {
      const res = await fetch(
        `/api/classrooms/${courseId}/quizzes/${quizId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      }
    } catch {
      console.error("Failed to delete quiz");
    } finally {
      setDeletingId(null);
    }
  }

  const chapterOptions = sections.map((s) => {
    const taken = quizzes.some((q) => q.order === s.order);
    return {
      value: String(s.order),
      label: taken
        ? `Ch ${s.order}: ${s.title} (has quiz)`
        : `Ch ${s.order}: ${s.title}`,
      disabled: taken,
    };
  });

  const availableChapterOptions = chapterOptions.filter((o) => !o.disabled);
  const hasFinal = quizzes.some(
    (q) => q.isFinal || q.order === maxSectionOrder + 1
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowForm(true);
              const free = availableChapterOptions[0];
              setSectionOrder(free?.value || String(sections[0]?.order || ""));
              setPlacement(free || !hasFinal ? (free ? "chapter" : "final") : "chapter");
            }}
            disabled={sections.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
        </div>
      )}

      {sections.length === 0 && !showForm && (
        <p className="text-sm text-text-muted">
          Add chapters and lessons first, then create chapter quizzes and a final exam.
        </p>
      )}

      {showForm && (
        <Card className="border-brand/20 bg-brand/[0.02]">
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-text-primary">
                {step === 1 ? "Step 1: Quiz Settings" : "Step 2: Add Questions"}
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div
                    className={`h-2 w-8 rounded-full ${
                      step >= 1 ? "bg-brand" : "bg-white/[0.1]"
                    }`}
                  />
                  <div
                    className={`h-2 w-8 rounded-full ${
                      step >= 2 ? "bg-brand" : "bg-white/[0.1]"
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-text-tertiary hover:text-text-secondary transition-colors ml-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <Input
                  label="Quiz Title"
                  name="quizTitle"
                  placeholder="e.g., Chapter 1 Assessment"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <Textarea
                  label="Description (optional)"
                  name="quizDescription"
                  placeholder="Describe what this quiz covers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    Placement
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPlacement("chapter")}
                      className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                        placement === "chapter"
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-white/[0.08] text-text-secondary"
                      }`}
                    >
                      Chapter quiz
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlacement("final")}
                      disabled={hasFinal}
                      className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                        placement === "final"
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-white/[0.08] text-text-secondary"
                      } disabled:opacity-40`}
                    >
                      Final exam
                    </button>
                  </div>
                  <p className="text-xs text-text-muted">
                    Chapter quizzes unlock the next chapter. The final exam unlocks
                    the certificate (order {maxSectionOrder + 1}).
                  </p>
                </div>

                {placement === "chapter" && (
                  <Select
                    label="Chapter"
                    options={
                      availableChapterOptions.length
                        ? availableChapterOptions
                        : [{ value: "", label: "No chapters available" }]
                    }
                    value={sectionOrder}
                    onChange={(e) => setSectionOrder(e.target.value)}
                  />
                )}

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Time Limit (min)"
                    name="timeLimit"
                    type="number"
                    placeholder="No limit"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                  />
                  <Input
                    label="Passing Score (%)"
                    name="passingScore"
                    type="number"
                    placeholder="50"
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value)}
                  />
                  <Input
                    label="Max Attempts"
                    name="maxAttempts"
                    type="number"
                    placeholder="3"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex items-center gap-3">
                  <Button variant="primary" size="sm" onClick={goToStep2}>
                    Next: Add Questions
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <QuizQuestionEditor
                  questions={questions}
                  onChange={setQuestions}
                />

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmit}
                    isLoading={submitting}
                  >
                    {submitting ? "Saving..." : "Save Quiz"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {quizzes.length === 0 && !showForm ? (
        <EmptyState
          icon={<HelpCircle className="h-12 w-12" />}
          title="No quizzes yet"
          description="Add a quiz per chapter and a final exam so students unlock content and earn certificates."
          action={
            sections.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Quiz
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {quizzes.map((quiz) => {
            const isToggling = togglingId === quiz.id;
            const isDeleting = deletingId === quiz.id;
            const final =
              quiz.isFinal || quiz.order === maxSectionOrder + 1;

            return (
              <Card key={quiz.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        {final ? (
                          <Award className="h-4 w-4 text-amber-400" />
                        ) : (
                          <HelpCircle className="h-4 w-4 text-purple-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {quiz.title}
                          </p>
                          <Badge
                            variant={final ? "warning" : "default"}
                            size="sm"
                          >
                            {final
                              ? "Final exam"
                              : quiz.sectionTitle
                                ? `Ch ${quiz.order}: ${quiz.sectionTitle}`
                                : `Chapter ${quiz.order}`}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-xs text-text-tertiary flex items-center gap-1">
                            <HelpCircle className="h-3 w-3" />
                            {quiz._count.questions}{" "}
                            {quiz._count.questions === 1
                              ? "question"
                              : "questions"}
                          </span>
                          <span className="text-xs text-text-tertiary flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {quiz.passingScore}% to pass
                          </span>
                          {quiz.timeLimit && (
                            <span className="text-xs text-text-tertiary flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {quiz.timeLimit}m
                            </span>
                          )}
                          <span className="text-xs text-text-tertiary flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {quiz.maxAttempts} attempts
                          </span>
                          {quiz._count.attempts > 0 && (
                            <span className="text-xs text-text-tertiary flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {quiz._count.attempts}{" "}
                              {quiz._count.attempts === 1
                                ? "submission"
                                : "submissions"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={quiz.isActive ? "success" : "default"}
                        size="sm"
                      >
                        {quiz.isActive ? "Active" : "Inactive"}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(quiz)}
                        disabled={isToggling}
                        title={
                          quiz.isActive ? "Deactivate quiz" : "Activate quiz"
                        }
                      >
                        {isToggling ? (
                          <Loader2 className="h-4 w-4 animate-spin text-text-tertiary" />
                        ) : quiz.isActive ? (
                          <ToggleRight className="h-4 w-4 text-green-400" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-text-tertiary" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(quiz.id)}
                        isLoading={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
