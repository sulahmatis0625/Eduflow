"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LessonVideoPlayer } from "@/components/course/lesson-video-player";
import { useToast } from "@/components/ui/toast";
import {
  QuizQuestionEditor,
  EMPTY_QUESTION,
  validateQuizQuestions,
  serializeQuizQuestions,
  type QuizQuestionDraft,
} from "@/components/dashboard/quiz-question-editor";
import {
  CourseChapterOrganizer,
  type OrganizerChapter,
} from "@/components/dashboard/course-chapter-organizer";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
  Link2,
  ListTree,
  Loader2,
  Video,
  BookOpen,
  Rocket,
  HelpCircle,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AssessmentDraft = {
  enabled: boolean;
  expanded: boolean;
  title: string;
  passingScore: string;
  maxAttempts: string;
  timeLimit: string;
  questions: QuizQuestionDraft[];
};

function emptyAssessment(title: string): AssessmentDraft {
  return {
    enabled: false,
    expanded: false,
    title,
    passingScore: "50",
    maxAttempts: "3",
    timeLimit: "",
    questions: [{ ...EMPTY_QUESTION }],
  };
}

type PlaylistVideo = {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string | null;
  url: string;
  durationMinutes: number;
  position: number;
};

type Chapter = {
  id: string;
  title: string;
  lessons: PlaylistVideo[];
};

type ContentMode = "choose" | "playlist" | "customize";

const levelOptions = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const STEPS = [
  { id: 1, label: "Course info" },
  { id: 2, label: "Videos" },
  { id: 3, label: "Chapters & preview" },
  { id: 4, label: "Assessments" },
  { id: 5, label: "Publish" },
];

function newChapterId() {
  return `ch_${Math.random().toString(36).slice(2, 9)}`;
}

function newLessonId() {
  return `les_${Math.random().toString(36).slice(2, 9)}`;
}

function withLessonIds(
  videos: Omit<PlaylistVideo, "id">[]
): PlaylistVideo[] {
  return videos.map((v, i) => ({
    ...v,
    id: newLessonId(),
    position: v.position ?? i,
  }));
}

export default function CreateCourseWizardPage() {
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    title: "",
    shortDescription: "",
    description: "",
    level: "BEGINNER",
    isFree: false,
    price: "",
    tags: "",
  });

  const [contentMode, setContentMode] = useState<ContentMode>("choose");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [extraVideoUrl, setExtraVideoUrl] = useState("");
  const [customChapterCount, setCustomChapterCount] = useState(2);
  const [customLessonCounts, setCustomLessonCounts] = useState<number[]>([3, 3]);
  const [customTitles, setCustomTitles] = useState<string[]>([
    "Chapter 1",
    "Chapter 2",
  ]);
  const [customUrls, setCustomUrls] = useState<string[][]>([
    ["", "", ""],
    ["", "", ""],
  ]);
  const [playlistMeta, setPlaylistMeta] = useState<{
    title: string;
    description: string;
    thumbnail: string | null;
  } | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [previewKey, setPreviewKey] = useState<{
    chapterId: string;
    lessonId: string;
  } | null>(null);

  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseSlug, setCourseSlug] = useState<string | null>(null);

  /** Per-chapter assessment drafts keyed by chapter id; plus final exam. */
  const [chapterAssessments, setChapterAssessments] = useState<
    Record<string, AssessmentDraft>
  >({});
  const [finalAssessment, setFinalAssessment] = useState<AssessmentDraft>(
    emptyAssessment("Final Exam")
  );

  const stepRef = useRef(step);
  const modeRef = useRef(contentMode);
  stepRef.current = step;
  modeRef.current = contentMode;

  /** One undo step for browser/navbar back — wizard steps share one URL. */
  const pushWizardState = (nextStep: number, nextMode?: ContentMode) => {
    const mode = nextMode ?? modeRef.current;
    window.history.pushState(
      { eduflowWizard: true, step: nextStep, contentMode: mode },
      ""
    );
    setStep(nextStep);
    if (nextMode !== undefined) setContentMode(nextMode);
  };

  const wizardBack = () => {
    window.history.back();
  };

  useEffect(() => {
    window.history.replaceState(
      { eduflowWizard: true, step: 1, contentMode: "choose" },
      ""
    );
    const onPop = (e: PopStateEvent) => {
      const s = e.state as
        | { eduflowWizard?: boolean; step?: number; contentMode?: ContentMode }
        | null;
      if (s?.eduflowWizard) {
        setStep(s.step ?? 1);
        setContentMode(s.contentMode ?? "choose");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const flatLessons = useMemo(
    () => chapters.flatMap((ch) => ch.lessons),
    [chapters]
  );

  const previewVideo = useMemo(() => {
    if (!previewKey) return flatLessons[0] || null;
    const ch = chapters.find((c) => c.id === previewKey.chapterId);
    return (
      ch?.lessons.find((l) => l.id === previewKey.lessonId) ||
      flatLessons[0] ||
      null
    );
  }, [previewKey, chapters, flatLessons]);

  const syncCustomStructure = (chapterCount: number, lessonCounts: number[]) => {
    const counts = Array.from({ length: chapterCount }, (_, i) =>
      Math.max(1, lessonCounts[i] ?? 3)
    );
    setCustomChapterCount(chapterCount);
    setCustomLessonCounts(counts);
    setCustomTitles((prev) =>
      Array.from(
        { length: chapterCount },
        (_, i) => prev[i] || `Chapter ${i + 1}`
      )
    );
    setCustomUrls((prev) =>
      counts.map((n, i) =>
        Array.from({ length: n }, (_, j) => prev[i]?.[j] || "")
      )
    );
  };

  const totalDuration = useMemo(
    () => flatLessons.reduce((sum, v) => sum + (v.durationMinutes || 0), 0),
    [flatLessons]
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const ensureDraftCourse = async () => {
    if (courseId) return courseId;

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        shortDescription:
          form.shortDescription.trim() || form.description.trim().slice(0, 140),
        description: form.description.trim(),
        level: form.level,
        isFree: form.isFree,
        price: form.isFree ? 0 : Number(form.price) || 0,
        tags: form.tags.trim() || undefined,
        status: "DRAFT",
        currency: "ETB",
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create course");

    setCourseId(data.id);
    setCourseSlug(data.slug);
    return data.id as string;
  };

  const goStep1Next = async () => {
    setError(null);
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setBusy(true);
    try {
      await ensureDraftCourse();
      pushWizardState(2, "choose");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save course");
    } finally {
      setBusy(false);
    }
  };

  const importPlaylist = async () => {
    setError(null);
    if (!playlistUrl.trim()) {
      setError("Paste a YouTube playlist URL first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/youtube/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: playlistUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      const videos = withLessonIds(
        (data.videos || []) as Omit<PlaylistVideo, "id">[]
      );
      setPlaylistMeta({
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
      });

      const initial: Chapter[] = [
        {
          id: newChapterId(),
          title: "Chapter 1",
          lessons: videos,
        },
      ];
      setChapters(initial);
      if (videos[0]) {
        setPreviewKey({ chapterId: initial[0].id, lessonId: videos[0].id });
      }

      setForm((prev) => ({
        ...prev,
        title: prev.title || data.title || prev.title,
        shortDescription:
          prev.shortDescription ||
          (data.description || "").slice(0, 140) ||
          prev.shortDescription,
        description:
          prev.description.length > 20
            ? prev.description
            : data.description || prev.description || data.title,
      }));

      toast(
        "success",
        `Imported ${videos.length} videos — add more below or continue`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import playlist");
    } finally {
      setBusy(false);
    }
  };

  const addExtraVideo = async () => {
    setError(null);
    if (!extraVideoUrl.trim()) {
      setError("Paste a YouTube video URL to add.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/youtube/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: extraVideoUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add video");
      const video = withLessonIds([
        data.video as Omit<PlaylistVideo, "id">,
      ])[0];

      setChapters((prev) => {
        if (prev.length === 0) {
          const chId = newChapterId();
          setPreviewKey({ chapterId: chId, lessonId: video.id });
          return [{ id: chId, title: "Chapter 1", lessons: [video] }];
        }
        const next = [...prev];
        const last = next.length - 1;
        next[last] = {
          ...next[last],
          lessons: [...next[last].lessons, video],
        };
        return next;
      });
      setExtraVideoUrl("");
      toast("success", "Video added");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add video");
    } finally {
      setBusy(false);
    }
  };

  const importCustomStructure = async () => {
    setError(null);
    const urlsFlat = customUrls.flatMap((row, ci) =>
      row.map((url, li) => ({ url: url.trim(), ci, li }))
    );
    const missing = urlsFlat.find((u) => !u.url);
    if (missing) {
      setError(
        `Fill every lesson URL (Chapter ${missing.ci + 1}, lesson ${missing.li + 1}).`
      );
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/youtube/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlsFlat.map((u) => u.url) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      const videos = withLessonIds(
        (data.videos || []) as Omit<PlaylistVideo, "id">[]
      );
      let cursor = 0;
      const built: Chapter[] = customLessonCounts.map((count, ci) => {
        const slice = videos.slice(cursor, cursor + count);
        cursor += count;
        return {
          id: newChapterId(),
          title: customTitles[ci]?.trim() || `Chapter ${ci + 1}`,
          lessons: slice,
        };
      });

      setChapters(built);
      setPlaylistMeta((prev) => ({
        title: prev?.title || form.title,
        description: prev?.description || form.description,
        thumbnail: built[0]?.lessons[0]?.thumbnail || prev?.thumbnail || null,
      }));
      if (built[0]?.lessons[0]) {
        setPreviewKey({
          chapterId: built[0].id,
          lessonId: built[0].lessons[0].id,
        });
      }
      toast("success", `Loaded ${videos.length} videos`);
      pushWizardState(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import videos");
    } finally {
      setBusy(false);
    }
  };

  const goVideosNext = () => {
    setError(null);
    if (flatLessons.length === 0) {
      setError("Add at least one video before continuing.");
      return;
    }
    pushWizardState(3);
  };

  const renameChapter = (chapterId: string, title: string) => {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, title } : ch))
    );
  };

  const addEmptyChapter = () => {
    const id = newChapterId();
    setChapters((prev) => [
      ...prev,
      { id, title: `Chapter ${prev.length + 1}`, lessons: [] },
    ]);
    return id;
  };

  const removeChapter = (chapterId: string) => {
    setChapters((prev) => {
      if (prev.length <= 1) return prev;
      const idx = prev.findIndex((c) => c.id === chapterId);
      if (idx < 0) return prev;
      const orphaned = prev[idx].lessons;
      const next = prev.filter((c) => c.id !== chapterId);
      // Move orphaned lessons into previous chapter (or first)
      const targetIdx = Math.max(0, idx - 1);
      next[targetIdx] = {
        ...next[targetIdx],
        lessons: [...next[targetIdx].lessons, ...orphaned],
      };
      return next;
    });
  };

  /** Split: lessons from this index onward become a new chapter below */
  const splitChapterAt = (chapterId: string, lessonIndex: number) => {
    if (lessonIndex <= 0) return;
    setChapters((prev) => {
      const idx = prev.findIndex((c) => c.id === chapterId);
      if (idx < 0) return prev;
      const ch = prev[idx];
      const keep = ch.lessons.slice(0, lessonIndex);
      const move = ch.lessons.slice(lessonIndex);
      if (move.length === 0) return prev;
      const newCh: Chapter = {
        id: newChapterId(),
        title: `Chapter ${idx + 2}`,
        lessons: move,
      };
      const next = [...prev];
      next[idx] = { ...ch, lessons: keep };
      next.splice(idx + 1, 0, newCh);
      // Renumber default titles that still look like "Chapter N"
      return next.map((c, i) =>
        /^Chapter \d+$/i.test(c.title) ? { ...c, title: `Chapter ${i + 1}` } : c
      );
    });
  };

  const removeLesson = (chapterId: string, lessonId: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId
          ? { ...ch, lessons: ch.lessons.filter((l) => l.id !== lessonId) }
          : ch
      )
    );
  };

  const reorderLesson = (
    fromChapterId: string,
    lessonId: string,
    toChapterId: string,
    toIndex: number
  ) => {
    setChapters((prev) => {
      const next = prev.map((ch) => ({ ...ch, lessons: [...ch.lessons] }));
      const fromCi = next.findIndex((c) => c.id === fromChapterId);
      const toCi = next.findIndex((c) => c.id === toChapterId);
      if (fromCi < 0 || toCi < 0) return prev;
      const fromLessons = next[fromCi].lessons;
      const li = fromLessons.findIndex((l) => l.id === lessonId);
      if (li < 0) return prev;
      const [item] = fromLessons.splice(li, 1);
      let insertAt = toIndex;
      if (fromCi === toCi && li < toIndex) insertAt = toIndex - 1;
      insertAt = Math.max(0, Math.min(insertAt, next[toCi].lessons.length));
      next[toCi].lessons.splice(insertAt, 0, item);
      return next;
    });
  };

  const moveLessonToChapter = (
    fromChapterId: string,
    lessonId: string,
    toChapterId: string
  ) => {
    if (fromChapterId === toChapterId) return;
    setChapters((prev) => {
      let moving: PlaylistVideo | null = null;
      const stripped = prev.map((ch) => {
        if (ch.id !== fromChapterId) return ch;
        const lesson = ch.lessons.find((l) => l.id === lessonId);
        if (lesson) moving = lesson;
        return { ...ch, lessons: ch.lessons.filter((l) => l.id !== lessonId) };
      });
      if (!moving) return prev;
      return stripped.map((ch) =>
        ch.id === toChapterId
          ? { ...ch, lessons: [...ch.lessons, moving!] }
          : ch
      );
    });
  };

  const goToAssessments = () => {
    setError(null);
    const nonEmpty = chapters.filter((c) => c.lessons.length > 0);
    if (nonEmpty.length === 0) {
      setError("Add at least one lesson before continuing.");
      return;
    }
    setChapterAssessments((prev) => {
      const next: Record<string, AssessmentDraft> = {};
      nonEmpty.forEach((ch, i) => {
        next[ch.id] =
          prev[ch.id] ||
          emptyAssessment(`Chapter ${i + 1} Quiz`);
        if (!prev[ch.id]) {
          next[ch.id].title = `${ch.title} Quiz`;
        }
      });
      return next;
    });
    pushWizardState(4);
  };

  const updateChapterAssessment = (
    chapterId: string,
    patch: Partial<AssessmentDraft>
  ) => {
    setChapterAssessments((prev) => ({
      ...prev,
      [chapterId]: { ...prev[chapterId], ...patch },
    }));
  };

  const validateEnabledAssessments = (): string | null => {
    const nonEmpty = chapters.filter((c) => c.lessons.length > 0);
    for (let i = 0; i < nonEmpty.length; i++) {
      const ch = nonEmpty[i];
      const draft = chapterAssessments[ch.id];
      if (!draft?.enabled) continue;
      if (!draft.title.trim()) {
        return `Chapter ${i + 1} quiz needs a title.`;
      }
      const qErr = validateQuizQuestions(draft.questions);
      if (qErr) return `Chapter ${i + 1}: ${qErr}`;
    }
    if (finalAssessment.enabled) {
      if (!finalAssessment.title.trim()) {
        return "Final exam needs a title.";
      }
      const qErr = validateQuizQuestions(finalAssessment.questions);
      if (qErr) return `Final exam: ${qErr}`;
    }
    return null;
  };

  const publishCourse = async (opts?: { skipAssessments?: boolean }) => {
    setError(null);
    const nonEmpty = chapters.filter((c) => c.lessons.length > 0);
    if (nonEmpty.length === 0) {
      setError("Add at least one lesson before publishing.");
      return;
    }

    const skipAssessments = Boolean(opts?.skipAssessments);
    if (!skipAssessments) {
      const assessmentError = validateEnabledAssessments();
      if (assessmentError) {
        setError(assessmentError);
        return;
      }
    }

    setBusy(true);
    try {
      const id = await ensureDraftCourse();
      const first = nonEmpty[0].lessons[0];

      await fetch(`/api/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          shortDescription:
            form.shortDescription.trim() ||
            form.description.trim().slice(0, 140),
          description: form.description.trim(),
          level: form.level,
          isFree: form.isFree,
          price: form.isFree ? 0 : Number(form.price) || 0,
          tags: form.tags.trim() || undefined,
          thumbnail: playlistMeta?.thumbnail || first?.thumbnail,
          previewVideo: first?.url,
        }),
      });

      const importRes = await fetch(`/api/classrooms/${id}/import-playlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapters: nonEmpty.map((ch) => ({
            title: ch.title,
            lessons: ch.lessons,
          })),
          thumbnail: playlistMeta?.thumbnail || first?.thumbnail,
          replaceExisting: true,
        }),
      });
      const importData = await importRes.json();
      if (!importRes.ok) {
        throw new Error(importData.error || "Failed to import lessons");
      }

      // Create enabled chapter quizzes + final (section order matches import: 1..N)
      if (!skipAssessments) {
        for (let i = 0; i < nonEmpty.length; i++) {
          const ch = nonEmpty[i];
          const draft = chapterAssessments[ch.id];
          if (!draft?.enabled) continue;
          const quizRes = await fetch(`/api/classrooms/${id}/quizzes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: draft.title.trim(),
              sectionOrder: i + 1,
              passingScore: draft.passingScore
                ? parseFloat(draft.passingScore)
                : 50,
              maxAttempts: draft.maxAttempts
                ? parseInt(draft.maxAttempts, 10)
                : 3,
              timeLimit: draft.timeLimit
                ? parseInt(draft.timeLimit, 10)
                : undefined,
              questions: serializeQuizQuestions(draft.questions),
            }),
          });
          if (!quizRes.ok) {
            const data = await quizRes.json();
            throw new Error(
              data.error || `Failed to create quiz for chapter ${i + 1}`
            );
          }
        }

        if (finalAssessment.enabled) {
          const quizRes = await fetch(`/api/classrooms/${id}/quizzes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: finalAssessment.title.trim() || "Final Exam",
              isFinal: true,
              passingScore: finalAssessment.passingScore
                ? parseFloat(finalAssessment.passingScore)
                : 50,
              maxAttempts: finalAssessment.maxAttempts
                ? parseInt(finalAssessment.maxAttempts, 10)
                : 3,
              timeLimit: finalAssessment.timeLimit
                ? parseInt(finalAssessment.timeLimit, 10)
                : undefined,
              questions: serializeQuizQuestions(finalAssessment.questions),
            }),
          });
          if (!quizRes.ok) {
            const data = await quizRes.json();
            throw new Error(data.error || "Failed to create final exam");
          }
        }
      }

      const targetStatus = isAdmin ? "PUBLISHED" : "PENDING";
      const pubRes = await fetch(`/api/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      const pubData = await pubRes.json();
      if (!pubRes.ok) {
        throw new Error(pubData.error || "Failed to publish");
      }

      setCourseSlug(pubData.slug || courseSlug);
      if (isAdmin) {
        toast("success", "Course published directly! Students can find it now.");
      } else {
        toast("success", "Course submitted for review! It will be live once approved by an Admin.");
      }
      pushWizardState(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Create Course</h1>
        <p className="text-text-secondary mt-1">
          Build a course from a playlist, individual videos, or both — then
          organize chapters and publish.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
              step === s.id
                ? "bg-brand/15 text-brand border-brand/30"
                : step > s.id
                  ? "bg-white/[0.04] text-text-secondary border-white/[0.08]"
                  : "text-text-muted border-white/[0.06]"
            )}
          >
            <span
              className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center text-[10px]",
                step > s.id ? "bg-brand text-surface-0" : "bg-white/10"
              )}
            >
              {step > s.id ? <Check className="h-3 w-3" /> : s.id}
            </span>
            {s.label}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <Input
              label="Course title"
              name="title"
              placeholder="e.g. Front End Developer Learning Path"
              value={form.title}
              onChange={handleChange}
              required
            />
            <Input
              label="Short description"
              name="shortDescription"
              placeholder="One-line summary for course cards"
              value={form.shortDescription}
              onChange={handleChange}
            />
            <Textarea
              label="Full description"
              name="description"
              placeholder="What will students learn?"
              value={form.description}
              onChange={handleChange}
              rows={5}
              required
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Level"
                name="level"
                options={levelOptions}
                value={form.level}
                onChange={handleChange}
              />
              <Input
                label="Tags (comma separated)"
                name="tags"
                placeholder="html, css, javascript"
                value={form.tags}
                onChange={handleChange}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                name="isFree"
                checked={form.isFree}
                onChange={handleChange}
                className="rounded border-white/20"
              />
              Free course (students can enroll without payment)
            </label>
            {!form.isFree && (
              <Input
                label="Price (ETB)"
                name="price"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 499"
                value={form.price}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d.]/g, "");
                  setForm((prev) => ({ ...prev, price: raw }));
                }}
                onFocus={(e) => {
                  if (form.price === "0") {
                    setForm((prev) => ({ ...prev, price: "" }));
                    e.target.value = "";
                  }
                }}
              />
            )}
            <div className="flex justify-end pt-2">
              <Button onClick={goStep1Next} isLoading={busy}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            {contentMode === "choose" && (
              <>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    How do you want to add videos?
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Import a playlist, or build chapters yourself with individual
                    video links. You can mix both later.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => pushWizardState(2, "playlist")}
                    className="text-left rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 hover:border-brand/40 hover:bg-brand/5 transition-all"
                  >
                    <Layers className="h-6 w-6 text-brand mb-3" />
                    <p className="font-semibold text-text-primary">
                      YouTube playlist
                    </p>
                    <p className="text-xs text-text-secondary mt-1.5">
                      Import a public playlist, then optionally add individual
                      videos on top.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => pushWizardState(2, "customize")}
                    className="text-left rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 hover:border-brand/40 hover:bg-brand/5 transition-all"
                  >
                    <ListTree className="h-6 w-6 text-brand mb-3" />
                    <p className="font-semibold text-text-primary">
                      Customize myself
                    </p>
                    <p className="text-xs text-text-secondary mt-1.5">
                      Set chapters and lesson counts, then paste a normal video
                      URL for each lesson.
                    </p>
                  </button>
                </div>
                <div className="flex justify-start pt-2">
                  <Button variant="ghost" onClick={wizardBack} disabled={busy}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
              </>
            )}

            {contentMode === "playlist" && (
              <>
                <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 flex gap-3">
                  <Video className="h-6 w-6 text-brand shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Import a public YouTube playlist
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Use a playlist URL with{" "}
                      <code className="text-brand">list=PL...</code>. After
                      import you can add individual videos too.
                    </p>
                  </div>
                </div>
                <Input
                  label="YouTube playlist URL"
                  name="playlistUrl"
                  placeholder="https://www.youtube.com/playlist?list=..."
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={importPlaylist} isLoading={busy}>
                    <Link2 className="h-4 w-4 mr-2" />
                    {flatLessons.length > 0 ? "Re-import playlist" : "Import playlist"}
                  </Button>
                </div>

                {flatLessons.length > 0 && (
                  <div className="rounded-xl border border-white/[0.08] p-4 space-y-3">
                    <p className="text-sm text-text-primary">
                      {flatLessons.length} video
                      {flatLessons.length !== 1 ? "s" : ""} ready
                      {playlistMeta?.title ? (
                        <span className="text-text-secondary">
                          {" "}
                          · {playlistMeta.title}
                        </span>
                      ) : null}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        label="Add an individual video (optional)"
                        name="extraVideoUrl"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={extraVideoUrl}
                        onChange={(e) => setExtraVideoUrl(e.target.value)}
                      />
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          onClick={addExtraVideo}
                          isLoading={busy}
                          className="w-full sm:w-auto"
                        >
                          Add video
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setError(null);
                      wizardBack();
                    }}
                    disabled={busy}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={goVideosNext}
                    disabled={flatLessons.length === 0 || busy}
                  >
                    Continue to organize
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {contentMode === "customize" && (
              <>
                <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 flex gap-3">
                  <ListTree className="h-6 w-6 text-brand shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Build your own chapter structure
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Choose how many chapters and lessons, then paste a normal
                      YouTube video URL for each lesson (not a playlist).
                    </p>
                  </div>
                </div>

                <div className="max-w-xs">
                  <Input
                    label="Number of chapters"
                    type="number"
                    min={1}
                    max={20}
                    value={String(customChapterCount)}
                    onChange={(e) => {
                      const n = Math.max(
                        1,
                        Math.min(20, parseInt(e.target.value || "1", 10) || 1)
                      );
                      syncCustomStructure(n, customLessonCounts);
                    }}
                  />
                </div>

                <div className="space-y-5 max-h-[420px] overflow-y-auto pr-1">
                  {Array.from({ length: customChapterCount }, (_, ci) => (
                    <div
                      key={ci}
                      className="rounded-xl border border-white/[0.08] p-4 space-y-3"
                    >
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Input
                          label={`Chapter ${ci + 1} title`}
                          value={customTitles[ci] || ""}
                          onChange={(e) =>
                            setCustomTitles((prev) => {
                              const next = [...prev];
                              next[ci] = e.target.value;
                              return next;
                            })
                          }
                        />
                        <Input
                          label="Lessons in this chapter"
                          type="number"
                          min={1}
                          max={40}
                          value={String(customLessonCounts[ci] ?? 1)}
                          onChange={(e) => {
                            const n = Math.max(
                              1,
                              Math.min(
                                40,
                                parseInt(e.target.value || "1", 10) || 1
                              )
                            );
                            const counts = [...customLessonCounts];
                            counts[ci] = n;
                            syncCustomStructure(customChapterCount, counts);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        {Array.from(
                          { length: customLessonCounts[ci] ?? 1 },
                          (_, li) => (
                            <Input
                              key={li}
                              label={`Lesson ${li + 1} video URL`}
                              placeholder="https://www.youtube.com/watch?v=..."
                              value={customUrls[ci]?.[li] || ""}
                              onChange={(e) =>
                                setCustomUrls((prev) => {
                                  const next = prev.map((row) => [...row]);
                                  if (!next[ci]) next[ci] = [];
                                  next[ci][li] = e.target.value;
                                  return next;
                                })
                              }
                            />
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setError(null);
                      wizardBack();
                    }}
                    disabled={busy}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={importCustomStructure} isLoading={busy}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Import & continue
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    {form.title || playlistMeta?.title}
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">
                    {chapters.length} chapter{chapters.length !== 1 ? "s" : ""} ·{" "}
                    {flatLessons.length} lessons
                    {totalDuration > 0 ? ` · ~${totalDuration} min` : ""}
                  </p>
                </div>
                <Badge variant="info">Organize</Badge>
              </div>

              {previewVideo && (
                <div className="relative w-full max-w-3xl mx-auto aspect-video bg-black rounded-xl overflow-hidden">
                  <LessonVideoPlayer
                    url={previewVideo.url}
                    title={previewVideo.title}
                  />
                </div>
              )}
              {previewVideo && (
                <p className="text-sm text-text-secondary text-center">
                  Playing:{" "}
                  <span className="text-text-primary">{previewVideo.title}</span>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <CourseChapterOrganizer
                chapters={chapters as OrganizerChapter[]}
                previewKey={previewKey}
                onPreview={(chapterId, lessonId) =>
                  setPreviewKey({ chapterId, lessonId })
                }
                onRenameChapter={renameChapter}
                onAddChapter={addEmptyChapter}
                onRemoveChapter={removeChapter}
                onRemoveLesson={removeLesson}
                onSplitAt={splitChapterAt}
                onReorderLesson={reorderLesson}
                onMoveLessonToChapter={moveLessonToChapter}
              />

              <div className="flex justify-between gap-3 pt-2">
                <Button variant="ghost" onClick={wizardBack} disabled={busy}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={goToAssessments}
                  disabled={flatLessons.length === 0}
                >
                  Next: Assessments
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 4 && (
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Assessments
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Optional. Add a quiz per chapter (unlocks the next chapter) and a
                final exam (required for the certificate). You can also skip and
                add quizzes later from Manage Course.
              </p>
            </div>

            <div className="space-y-3">
              {chapters
                .filter((c) => c.lessons.length > 0)
                .map((ch, i) => {
                  const draft =
                    chapterAssessments[ch.id] ||
                    emptyAssessment(`${ch.title} Quiz`);
                  return (
                    <div
                      key={ch.id}
                      className="rounded-lg border border-white/[0.08] bg-white/[0.02]"
                    >
                      <div className="flex items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <HelpCircle className="h-4 w-4 text-text-tertiary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">
                              Chapter {i + 1}: {ch.title}
                            </p>
                            <p className="text-xs text-text-muted">
                              {draft.enabled
                                ? `${draft.questions.length} question(s)`
                                : "No quiz"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                            <input
                              type="checkbox"
                              checked={draft.enabled}
                              onChange={(e) =>
                                updateChapterAssessment(ch.id, {
                                  enabled: e.target.checked,
                                  expanded: e.target.checked,
                                  title: draft.title || `${ch.title} Quiz`,
                                })
                              }
                            />
                            Add quiz
                          </label>
                          {draft.enabled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateChapterAssessment(ch.id, {
                                  expanded: !draft.expanded,
                                })
                              }
                            >
                              {draft.expanded ? "Hide" : "Edit"}
                            </Button>
                          )}
                        </div>
                      </div>
                      {draft.enabled && draft.expanded && (
                        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-4">
                          <Input
                            label="Quiz title"
                            value={draft.title}
                            onChange={(e) =>
                              updateChapterAssessment(ch.id, {
                                title: e.target.value,
                              })
                            }
                          />
                          <div className="grid grid-cols-3 gap-3">
                            <Input
                              label="Pass %"
                              type="number"
                              value={draft.passingScore}
                              onChange={(e) =>
                                updateChapterAssessment(ch.id, {
                                  passingScore: e.target.value,
                                })
                              }
                            />
                            <Input
                              label="Attempts"
                              type="number"
                              value={draft.maxAttempts}
                              onChange={(e) =>
                                updateChapterAssessment(ch.id, {
                                  maxAttempts: e.target.value,
                                })
                              }
                            />
                            <Input
                              label="Time (min)"
                              type="number"
                              placeholder="None"
                              value={draft.timeLimit}
                              onChange={(e) =>
                                updateChapterAssessment(ch.id, {
                                  timeLimit: e.target.value,
                                })
                              }
                            />
                          </div>
                          <QuizQuestionEditor
                            questions={draft.questions}
                            onChange={(questions) =>
                              updateChapterAssessment(ch.id, { questions })
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04]">
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Award className="h-4 w-4 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Final exam
                      </p>
                      <p className="text-xs text-text-muted">
                        Students must pass this to earn a certificate
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={finalAssessment.enabled}
                        onChange={(e) =>
                          setFinalAssessment((prev) => ({
                            ...prev,
                            enabled: e.target.checked,
                            expanded: e.target.checked,
                          }))
                        }
                      />
                      Add final
                    </label>
                    {finalAssessment.enabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setFinalAssessment((prev) => ({
                            ...prev,
                            expanded: !prev.expanded,
                          }))
                        }
                      >
                        {finalAssessment.expanded ? "Hide" : "Edit"}
                      </Button>
                    )}
                  </div>
                </div>
                {finalAssessment.enabled && finalAssessment.expanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-4">
                    <Input
                      label="Exam title"
                      value={finalAssessment.title}
                      onChange={(e) =>
                        setFinalAssessment((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        label="Pass %"
                        type="number"
                        value={finalAssessment.passingScore}
                        onChange={(e) =>
                          setFinalAssessment((prev) => ({
                            ...prev,
                            passingScore: e.target.value,
                          }))
                        }
                      />
                      <Input
                        label="Attempts"
                        type="number"
                        value={finalAssessment.maxAttempts}
                        onChange={(e) =>
                          setFinalAssessment((prev) => ({
                            ...prev,
                            maxAttempts: e.target.value,
                          }))
                        }
                      />
                      <Input
                        label="Time (min)"
                        type="number"
                        placeholder="None"
                        value={finalAssessment.timeLimit}
                        onChange={(e) =>
                          setFinalAssessment((prev) => ({
                            ...prev,
                            timeLimit: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <QuizQuestionEditor
                      questions={finalAssessment.questions}
                      onChange={(questions) =>
                        setFinalAssessment((prev) => ({ ...prev, questions }))
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <Button variant="ghost" onClick={wizardBack} disabled={busy}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => void publishCourse({ skipAssessments: true })}
                  disabled={busy}
                >
                  Skip & publish
                </Button>
                <Button onClick={() => void publishCourse()} isLoading={busy}>
                  <Rocket className="h-4 w-4 mr-2" />
                  {isAdmin ? "Publish course" : "Submit for review"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-brand/15 flex items-center justify-center">
              <Check className="h-7 w-7 text-brand" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              {isAdmin ? "Course published!" : "Course submitted for review!"}
            </h2>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              {isAdmin
                ? `Your course is live with ${chapters.filter((c) => c.lessons.length).length} chapters. Students can find it on the Courses page.`
                : `Your course with ${chapters.filter((c) => c.lessons.length).length} chapters has been submitted to the Admin team. Once approved, it will be published to the public catalog.`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {courseId && (
                <Link href={`/dashboard/classrooms/${courseId}`}>
                  <Button>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Manage course
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/courses">
                <Button variant="outline">My Courses</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost">Back to dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {busy && step === 2 && (
        <div className="flex items-center justify-center gap-2 text-sm text-text-tertiary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Importing playlist…
        </div>
      )}
    </div>
  );
}
