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
} from "lucide-react";

interface QuizQuestion {
  id?: string;
  text: string;
  type: string;
  options: string | null;
  correctAnswer: string;
  points: number;
  explanation: string;
  order: number;
}

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
  _count: {
    questions: number;
    attempts: number;
  };
}

interface ClassroomQuizzesProps {
  courseId: string;
}

const QUESTION_TYPE_OPTIONS = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True / False" },
];

const EMPTY_QUESTION: QuizQuestion = {
  text: "",
  type: "MULTIPLE_CHOICE",
  options: JSON.stringify(["", "", "", ""]),
  correctAnswer: "",
  points: 1,
  explanation: "",
  order: 0,
};

export function ClassroomQuizzes({ courseId }: ClassroomQuizzesProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create quiz multi-step form
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Quiz settings
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [passingScore, setPassingScore] = useState("70");
  const [maxAttempts, setMaxAttempts] = useState("3");

  // Step 2: Questions
  const [questions, setQuestions] = useState<QuizQuestion[]>([{ ...EMPTY_QUESTION }]);

  // Toggle / delete states
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
        setQuizzes(data);
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
    setPassingScore("70");
    setMaxAttempts("3");
    setQuestions([{ ...EMPTY_QUESTION }]);
    setError("");
  }

  // --- Step navigation ---

  function goToStep2() {
    setError("");
    if (!title.trim()) {
      setError("Quiz title is required.");
      return;
    }
    setStep(2);
  }

  // --- Question helpers ---

  function updateQuestion(index: number, field: keyof QuizQuestion, value: string | number) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== questionIndex) return q;
        const opts: string[] = q.options ? JSON.parse(q.options) : ["", "", "", ""];
        opts[optionIndex] = value;
        return { ...q, options: JSON.stringify(opts) };
      })
    );
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { ...EMPTY_QUESTION, order: prev.length },
    ]);
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleTypeChange(index: number, newType: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== index) return q;
        if (newType === "TRUE_FALSE") {
          return {
            ...q,
            type: newType,
            options: JSON.stringify(["True", "False"]),
            correctAnswer: "",
          };
        }
        return {
          ...q,
          type: newType,
          options: JSON.stringify(["", "", "", ""]),
          correctAnswer: "",
        };
      })
    );
  }

  // --- Submit quiz ---

  async function handleSubmit() {
    setError("");

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`Question ${i + 1}: text is required.`);
        return;
      }
      if (!q.correctAnswer.trim()) {
        setError(`Question ${i + 1}: correct answer is required.`);
        return;
      }
      if (q.type === "MULTIPLE_CHOICE") {
        const opts: string[] = q.options ? JSON.parse(q.options) : [];
        const filledOpts = opts.filter((o) => o.trim());
        if (filledOpts.length < 2) {
          setError(`Question ${i + 1}: at least 2 options are required.`);
          return;
        }
        if (!opts.includes(q.correctAnswer)) {
          setError(`Question ${i + 1}: correct answer must match one of the options.`);
          return;
        }
      }
      if (q.type === "TRUE_FALSE" && !["True", "False"].includes(q.correctAnswer)) {
        setError(`Question ${i + 1}: correct answer must be "True" or "False".`);
        return;
      }
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
          passingScore: passingScore ? parseFloat(passingScore) : 70,
          maxAttempts: maxAttempts ? parseInt(maxAttempts, 10) : 3,
          questions: questions.map((q, i) => ({
            text: q.text.trim(),
            type: q.type,
            options: q.options,
            correctAnswer: q.correctAnswer.trim(),
            points: q.points || 1,
            explanation: q.explanation?.trim() || undefined,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create quiz.");
        return;
      }

      const newQuiz = await res.json();
      setQuizzes((prev) => [...prev, newQuiz]);
      resetForm();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Toggle active ---

  async function handleToggleActive(quiz: Quiz) {
    setTogglingId(quiz.id);
    try {
      const res = await fetch(`/api/classrooms/${courseId}/quizzes/${quiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !quiz.isActive }),
      });

      if (res.ok) {
        const updated = await res.json();
        setQuizzes((prev) =>
          prev.map((q) => (q.id === updated.id ? { ...q, isActive: updated.isActive } : q))
        );
      }
    } catch {
      console.error("Failed to toggle quiz");
    } finally {
      setTogglingId(null);
    }
  }

  // --- Delete quiz ---

  async function handleDelete(quizId: string) {
    setDeletingId(quizId);
    try {
      const res = await fetch(`/api/classrooms/${courseId}/quizzes/${quizId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      }
    } catch {
      console.error("Failed to delete quiz");
    } finally {
      setDeletingId(null);
    }
  }

  // --- Loading ---

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  // --- Render ---

  return (
    <div className="space-y-4">
      {/* Create Quiz Button */}
      {!showForm && (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
        </div>
      )}

      {/* Multi-step Create Form */}
      {showForm && (
        <Card className="border-brand/20 bg-brand/[0.02]">
          <CardContent>
            {/* Step indicator */}
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

            {/* Step 1: Settings */}
            {step === 1 && (
              <div className="space-y-4">
                <Input
                  label="Quiz Title"
                  name="quizTitle"
                  placeholder="e.g., Module 1 Assessment"
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
                    placeholder="70"
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

            {/* Step 2: Questions */}
            {step === 2 && (
              <div className="space-y-4">
                {questions.map((question, qIndex) => {
                  const opts: string[] = question.options
                    ? JSON.parse(question.options)
                    : ["", "", "", ""];

                  return (
                    <div
                      key={qIndex}
                      className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                          Question {qIndex + 1}
                        </span>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            className="text-text-tertiary hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <Textarea
                        label="Question Text"
                        name={`q-${qIndex}-text`}
                        placeholder="Enter your question..."
                        value={question.text}
                        onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                        rows={2}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <Select
                          label="Type"
                          options={QUESTION_TYPE_OPTIONS}
                          value={question.type}
                          onChange={(e) => handleTypeChange(qIndex, e.target.value)}
                        />
                        <Input
                          label="Points"
                          name={`q-${qIndex}-points`}
                          type="number"
                          placeholder="1"
                          value={String(question.points)}
                          onChange={(e) =>
                            updateQuestion(qIndex, "points", parseInt(e.target.value, 10) || 1)
                          }
                        />
                      </div>

                      {/* Options */}
                      {question.type === "MULTIPLE_CHOICE" && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-text-secondary">
                            Options
                          </label>
                          {opts.map((opt, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuestion(qIndex, "correctAnswer", opts[oIndex])}
                                className={`flex-shrink-0 h-5 w-5 rounded-full border-2 transition-colors ${
                                  question.correctAnswer === opt && opt.trim()
                                    ? "border-brand bg-brand"
                                    : "border-white/[0.15] hover:border-white/[0.3]"
                                }`}
                                title="Set as correct answer"
                              >
                                {question.correctAnswer === opt && opt.trim() && (
                                  <svg className="h-full w-full text-white p-0.5" viewBox="0 0 16 16" fill="none">
                                    <path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                              <Input
                                name={`q-${qIndex}-opt-${oIndex}`}
                                placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                value={opt}
                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              />
                            </div>
                          ))}
                          <p className="text-xs text-text-muted">
                            Click the circle to mark the correct answer
                          </p>
                        </div>
                      )}

                      {question.type === "TRUE_FALSE" && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-text-secondary">
                            Correct Answer
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => updateQuestion(qIndex, "correctAnswer", "True")}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                question.correctAnswer === "True"
                                  ? "border-brand bg-brand/10 text-brand"
                                  : "border-white/[0.08] text-text-secondary hover:border-white/[0.15]"
                              }`}
                            >
                              True
                            </button>
                            <button
                              type="button"
                              onClick={() => updateQuestion(qIndex, "correctAnswer", "False")}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                question.correctAnswer === "False"
                                  ? "border-brand bg-brand/10 text-brand"
                                  : "border-white/[0.08] text-text-secondary hover:border-white/[0.15]"
                              }`}
                            >
                              False
                            </button>
                          </div>
                        </div>
                      )}

                      <Textarea
                        label="Explanation (optional)"
                        name={`q-${qIndex}-explanation`}
                        placeholder="Explain why this is the correct answer..."
                        value={question.explanation}
                        onChange={(e) => updateQuestion(qIndex, "explanation", e.target.value)}
                        rows={2}
                      />
                    </div>
                  );
                })}

                {/* Add question button */}
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-2 w-full py-3 rounded-lg border border-dashed border-white/[0.1] text-sm text-text-tertiary hover:text-text-secondary hover:border-white/[0.2] transition-colors justify-center"
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </button>

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

      {/* Quiz List */}
      {quizzes.length === 0 && !showForm ? (
        <EmptyState
          icon={<HelpCircle className="h-12 w-12" />}
          title="No quizzes yet"
          description="Create quizzes to assess your students' understanding of the course material."
          action={
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Quiz
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {quizzes.map((quiz) => {
            const isToggling = togglingId === quiz.id;
            const isDeleting = deletingId === quiz.id;

            return (
              <Card key={quiz.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <HelpCircle className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {quiz.title}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-text-tertiary flex items-center gap-1">
                            <HelpCircle className="h-3 w-3" />
                            {quiz._count.questions}{" "}
                            {quiz._count.questions === 1 ? "question" : "questions"}
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
                              {quiz._count.attempts === 1 ? "submission" : "submissions"}
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
                        title={quiz.isActive ? "Deactivate quiz" : "Activate quiz"}
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
