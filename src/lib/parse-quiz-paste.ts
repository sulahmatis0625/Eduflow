import type { QuizQuestionDraft } from "@/components/dashboard/quiz-question-editor";

const ANSWER_LINE =
  /^(?:answer|ans|correct(?:\s*answer)?)\s*[:\-]\s*(.+)$/i;
const QUESTION_START =
  /^(?:(?:q(?:uestion)?\s*)?\d+[).:\-]|\d+\s*[-–]|question\s*\d+\s*[:.)\-]?)\s*(.+)$/i;

function blankMc(
  text: string,
  options: string[],
  correct: string,
  order: number
): QuizQuestionDraft {
  const padded = [...options];
  while (padded.length < 2) padded.push("");
  while (padded.length < 4) padded.push("");
  return {
    text,
    type: "MULTIPLE_CHOICE",
    options: JSON.stringify(padded.slice(0, Math.max(4, padded.length))),
    correctAnswer: correct,
    points: 1,
    explanation: "",
    order,
  };
}

function blankTf(
  text: string,
  correct: string,
  order: number
): QuizQuestionDraft {
  return {
    text,
    type: "TRUE_FALSE",
    options: JSON.stringify(["True", "False"]),
    correctAnswer: correct,
    points: 1,
    explanation: "",
    order,
  };
}

function resolveAnswer(
  raw: string,
  options: string[],
  letterKeys: string[]
): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (/^(true|t|yes)$/i.test(trimmed)) return "True";
  if (/^(false|f|no)$/i.test(trimmed)) return "False";

  const letter = trimmed.match(/^([A-Da-d])(?:[).:].*)?$/);
  if (letter) {
    const idx = letter[1].toUpperCase().charCodeAt(0) - 65;
    if (options[idx]?.trim()) return options[idx];
  }

  const num = trimmed.match(/^(\d+)(?:[).:].*)?$/);
  if (num) {
    const idx = parseInt(num[1], 10) - 1;
    if (options[idx]?.trim()) return options[idx];
  }

  const exact = options.find((o) => o.trim() === trimmed);
  if (exact) return exact;
  const loose = options.find(
    (o) => o.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (loose) return loose;

  const keyIdx = letterKeys.findIndex(
    (k) => k.toLowerCase() === trimmed[0]?.toLowerCase()
  );
  if (keyIdx >= 0 && options[keyIdx]?.trim()) return options[keyIdx];

  return trimmed;
}

type DraftBlock = {
  text: string;
  options: string[];
  letters: string[];
  answerRaw: string;
  starredIndex: number;
};

function flushBlock(
  block: DraftBlock | null,
  order: number
): QuizQuestionDraft | null {
  if (!block?.text.trim()) return null;

  const text = block.text.trim();
  const options = block.options.map((o) => o.trim()).filter(Boolean);

  let answer = "";
  if (block.answerRaw) {
    answer = resolveAnswer(block.answerRaw, options, block.letters);
  } else if (block.starredIndex >= 0 && options[block.starredIndex]) {
    answer = options[block.starredIndex];
  }

  if (
    options.length === 0 ||
    (options.length <= 2 &&
      options.every((o) => /^(true|false)$/i.test(o))) ||
    /^(true|false)$/i.test(answer)
  ) {
    if (options.length === 0 && (/^(true|false)$/i.test(answer) || !answer)) {
      const correct = /^(true|false)$/i.test(answer)
        ? answer[0].toUpperCase() + answer.slice(1).toLowerCase()
        : "";
      return blankTf(
        text,
        correct === "True" || correct === "False" ? correct : "",
        order
      );
    }
    if (
      options.length === 2 &&
      options.every((o) => /^(true|false)$/i.test(o))
    ) {
      const normalized = options.map(
        (o) => o[0].toUpperCase() + o.slice(1).toLowerCase()
      );
      const correct = resolveAnswer(
        block.answerRaw || answer,
        normalized,
        ["A", "B"]
      );
      return blankTf(text, correct, order);
    }
  }

  if (options.length >= 2) {
    return blankMc(text, options, answer, order);
  }

  return blankMc(
    text,
    options.length ? options : ["", "", "", ""],
    answer,
    order
  );
}

/**
 * Parse pasted quiz text into question drafts.
 * Supports numbered questions, A)/B)/C)/D) or bullet options,
 * Answer: lines, and * marked correct options.
 */
export function parseQuizPaste(raw: string): QuizQuestionDraft[] {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: QuizQuestionDraft[] = [];
  const state: { block: DraftBlock | null } = { block: null };

  const startBlock = (text: string) => {
    const flushed = flushBlock(state.block, results.length);
    if (flushed) results.push(flushed);
    state.block = {
      text,
      options: [],
      letters: [],
      answerRaw: "",
      starredIndex: -1,
    };
  };

  for (const line of lines) {
    const block = state.block;
    const ans = line.match(ANSWER_LINE);
    if (ans && block) {
      block.answerRaw = ans[1].trim();
      continue;
    }

    // New numbered question before option patterns (so "2. Text?" isn't option 2)
    const qStart = line.match(QUESTION_START);
    if (qStart) {
      startBlock(qStart[1].trim());
      continue;
    }

    const starred = line.match(/^[*]\s+(.+)$/);
    if (starred && block) {
      block.starredIndex = block.options.length;
      block.options.push(starred[1].trim());
      block.letters.push("");
      continue;
    }

    // Letter choices A-D (not bare 1. 2. 3. — those are question numbers)
    const letterOpt = line.match(
      /^(?:([A-Da-d])[).:\-]\s+|\(([A-Da-d])\)\s+)(.+)$/
    );
    if (letterOpt && block) {
      const letter = (letterOpt[1] || letterOpt[2] || "").toUpperCase();
      block.options.push(letterOpt[3].trim());
      block.letters.push(letter);
      continue;
    }

    const bulletOpt = line.match(/^[-•]\s+(.+)$/);
    if (bulletOpt && block) {
      block.options.push(bulletOpt[1].trim());
      block.letters.push(
        String.fromCharCode(65 + block.options.length - 1)
      );
      continue;
    }

    if (!block) {
      startBlock(line);
      continue;
    }

    if (block.options.length === 0 && !block.answerRaw) {
      block.text = `${block.text} ${line}`.trim();
      continue;
    }

    startBlock(line);
  }

  const last = flushBlock(state.block, results.length);
  if (last) results.push(last);

  return results.filter((q) => q.text.trim());
}
