"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { parseQuizPaste } from "@/lib/parse-quiz-paste";
import { cn } from "@/lib/utils";
import { ClipboardPaste, ListPlus, Plus, Trash2 } from "lucide-react";

export interface QuizQuestionDraft {
  id?: string;
  text: string;
  type: string;
  options: string | null;
  correctAnswer: string;
  points: number;
  explanation: string;
  order: number;
}

export const QUESTION_TYPE_OPTIONS = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True / False" },
];

export const EMPTY_QUESTION: QuizQuestionDraft = {
  text: "",
  type: "MULTIPLE_CHOICE",
  options: JSON.stringify(["", "", "", ""]),
  correctAnswer: "",
  points: 1,
  explanation: "",
  order: 0,
};

export function validateQuizQuestions(
  questions: QuizQuestionDraft[]
): string | null {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.text.trim()) return `Question ${i + 1}: text is required.`;
    if (!q.correctAnswer.trim()) {
      return `Question ${i + 1}: correct answer is required.`;
    }
    if (q.type === "MULTIPLE_CHOICE") {
      const opts: string[] = q.options ? JSON.parse(q.options) : [];
      const filledOpts = opts.filter((o) => o.trim());
      if (filledOpts.length < 2) {
        return `Question ${i + 1}: at least 2 options are required.`;
      }
      if (!opts.includes(q.correctAnswer)) {
        return `Question ${i + 1}: correct answer must match one of the options.`;
      }
    }
    if (
      q.type === "TRUE_FALSE" &&
      !["True", "False"].includes(q.correctAnswer)
    ) {
      return `Question ${i + 1}: correct answer must be "True" or "False".`;
    }
  }
  return null;
}

export function serializeQuizQuestions(questions: QuizQuestionDraft[]) {
  return questions.map((q) => ({
    text: q.text.trim(),
    type: q.type,
    options: q.options,
    correctAnswer: q.correctAnswer.trim(),
    points: q.points || 1,
    explanation: q.explanation?.trim() || undefined,
  }));
}

interface QuizQuestionEditorProps {
  questions: QuizQuestionDraft[];
  onChange: (questions: QuizQuestionDraft[]) => void;
}

type EditorMode = "manual" | "paste";

const PASTE_EXAMPLE = `1. What is JSX?
A) A templating language
B) A JavaScript syntax extension
C) A CSS framework
D) A testing library
Answer: B

2. React components must return a single root element.
Answer: True

3. Which hook is used for side effects?
A) useState
B) useEffect
C) useMemo
D) useRef
Answer: B`;

export function QuizQuestionEditor({
  questions,
  onChange,
}: QuizQuestionEditorProps) {
  const [mode, setMode] = useState<EditorMode>("manual");
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [pasteInfo, setPasteInfo] = useState("");

  function updateQuestion(
    index: number,
    field: keyof QuizQuestionDraft,
    value: string | number
  ) {
    onChange(
      questions.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  }

  function updateOption(
    questionIndex: number,
    optionIndex: number,
    value: string
  ) {
    onChange(
      questions.map((q, i) => {
        if (i !== questionIndex) return q;
        const opts: string[] = q.options
          ? JSON.parse(q.options)
          : ["", "", "", ""];
        opts[optionIndex] = value;
        return { ...q, options: JSON.stringify(opts) };
      })
    );
  }

  function addQuestion() {
    onChange([...questions, { ...EMPTY_QUESTION, order: questions.length }]);
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
    onChange(questions.filter((_, i) => i !== index));
  }

  function handleTypeChange(index: number, newType: string) {
    onChange(
      questions.map((q, i) => {
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

  function applyPaste(replace: boolean) {
    setPasteError("");
    setPasteInfo("");
    const parsed = parseQuizPaste(pasteText);
    if (parsed.length === 0) {
      setPasteError(
        "Could not detect questions. Use numbered items, A/B/C/D options, and Answer: lines."
      );
      return;
    }
    const missingAnswers = parsed.filter((q) => !q.correctAnswer.trim()).length;
    if (replace) {
      onChange(parsed);
    } else {
      const base = questions.filter((q) => q.text.trim() || q.correctAnswer.trim());
      const merged = [...base, ...parsed].map((q, i) => ({ ...q, order: i }));
      onChange(merged.length ? merged : parsed);
    }
    setPasteInfo(
      `Imported ${parsed.length} question${parsed.length === 1 ? "" : "s"}` +
        (missingAnswers
          ? ` — ${missingAnswers} still need a correct answer marked.`
          : ".")
    );
    setMode("manual");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            mode === "manual"
              ? "bg-brand/15 text-brand border-brand/30"
              : "text-text-secondary border-white/[0.08] hover:border-white/[0.15]"
          )}
        >
          <ListPlus className="h-3.5 w-3.5" />
          Write one by one
        </button>
        <button
          type="button"
          onClick={() => setMode("paste")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            mode === "paste"
              ? "bg-brand/15 text-brand border-brand/30"
              : "text-text-secondary border-white/[0.08] hover:border-white/[0.15]"
          )}
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          Paste questions
        </button>
      </div>

      {mode === "paste" && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-text-primary">
              Paste one or many questions
            </p>
            <p className="text-xs text-text-muted mt-1">
              Include choices on separate lines (A) B) C) D) or bullets) and mark
              the answer with <code className="text-brand">Answer: B</code> or{" "}
              <code className="text-brand">*</code> before the correct option.
            </p>
          </div>
          <Textarea
            label="Paste here"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={12}
            placeholder={PASTE_EXAMPLE}
            className="font-mono text-xs"
          />
          {pasteError && (
            <p className="text-xs text-red-400">{pasteError}</p>
          )}
          {pasteInfo && !pasteError && (
            <p className="text-xs text-brand">{pasteInfo}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => applyPaste(true)}
              disabled={!pasteText.trim()}
            >
              Replace with pasted
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyPaste(false)}
              disabled={!pasteText.trim()}
            >
              Add to existing
            </Button>
            <button
              type="button"
              className="text-xs text-text-muted hover:text-text-secondary underline"
              onClick={() => setPasteText(PASTE_EXAMPLE)}
            >
              Load example format
            </button>
          </div>
        </div>
      )}

      {mode === "manual" && (
        <>
          {pasteInfo && (
            <p className="text-xs text-brand">{pasteInfo}</p>
          )}
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
                  onChange={(e) =>
                    updateQuestion(qIndex, "text", e.target.value)
                  }
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
                      updateQuestion(
                        qIndex,
                        "points",
                        parseInt(e.target.value, 10) || 1
                      )
                    }
                  />
                </div>

                {question.type === "MULTIPLE_CHOICE" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary">
                      Options
                    </label>
                    {opts.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestion(
                              qIndex,
                              "correctAnswer",
                              opts[oIndex]
                            )
                          }
                          className={`flex-shrink-0 h-5 w-5 rounded-full border-2 transition-colors ${
                            question.correctAnswer === opt && opt.trim()
                              ? "border-brand bg-brand"
                              : "border-white/[0.15] hover:border-white/[0.3]"
                          }`}
                          title="Set as correct answer"
                        >
                          {question.correctAnswer === opt && opt.trim() && (
                            <svg
                              className="h-full w-full text-white p-0.5"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <path
                                d="M4 8l3 3 5-5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </button>
                        <Input
                          name={`q-${qIndex}-opt-${oIndex}`}
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          value={opt}
                          onChange={(e) =>
                            updateOption(qIndex, oIndex, e.target.value)
                          }
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
                      {(["True", "False"] as const).map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            updateQuestion(qIndex, "correctAnswer", val)
                          }
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            question.correctAnswer === val
                              ? "border-brand bg-brand/10 text-brand"
                              : "border-white/[0.08] text-text-secondary hover:border-white/[0.15]"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Textarea
                  label="Explanation (optional)"
                  name={`q-${qIndex}-explanation`}
                  placeholder="Explain why this is the correct answer..."
                  value={question.explanation}
                  onChange={(e) =>
                    updateQuestion(qIndex, "explanation", e.target.value)
                  }
                  rows={2}
                />
              </div>
            );
          })}

          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-2 w-full py-3 rounded-lg border border-dashed border-white/[0.1] text-sm text-text-tertiary hover:text-text-secondary hover:border-white/[0.2] transition-colors justify-center"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </button>
        </>
      )}
    </div>
  );
}
