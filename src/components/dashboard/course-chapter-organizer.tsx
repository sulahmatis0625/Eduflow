"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FolderPlus,
  GripVertical,
  PlayCircle,
  Scissors,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type OrganizerLesson = {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string | null;
  durationMinutes: number;
};

export type OrganizerChapter = {
  id: string;
  title: string;
  lessons: OrganizerLesson[];
};

type CourseChapterOrganizerProps = {
  chapters: OrganizerChapter[];
  previewKey: { chapterId: string; lessonId: string } | null;
  onPreview: (chapterId: string, lessonId: string) => void;
  onRenameChapter: (chapterId: string, title: string) => void;
  /** Returns the new chapter id so we can scroll to it. */
  onAddChapter: () => string;
  onRemoveChapter: (chapterId: string) => void;
  onRemoveLesson: (chapterId: string, lessonId: string) => void;
  onSplitAt: (chapterId: string, lessonIndex: number) => void;
  onReorderLesson: (
    fromChapterId: string,
    lessonId: string,
    toChapterId: string,
    toIndex: number
  ) => void;
  onMoveLessonToChapter: (
    fromChapterId: string,
    lessonId: string,
    toChapterId: string
  ) => void;
};

export function CourseChapterOrganizer({
  chapters,
  previewKey,
  onPreview,
  onRenameChapter,
  onAddChapter,
  onRemoveChapter,
  onRemoveLesson,
  onSplitAt,
  onReorderLesson,
  onMoveLessonToChapter,
}: CourseChapterOrganizerProps) {
  const [dragging, setDragging] = useState<{
    chapterId: string;
    lessonId: string;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    chapterId: string;
    index: number;
  } | null>(null);
  const [scrollToId, setScrollToId] = useState<string | null>(null);

  const outerRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const titleInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!scrollToId) return;
    const el = chapterRefs.current[scrollToId];
    const outer = outerRef.current;
    if (!el || !outer) return;

    // Scroll only the chapters list — not the whole page
    const top =
      el.getBoundingClientRect().top -
      outer.getBoundingClientRect().top +
      outer.scrollTop;
    outer.scrollTo({ top, behavior: "smooth" });

    requestAnimationFrame(() => {
      titleInputRefs.current[scrollToId]?.focus();
      titleInputRefs.current[scrollToId]?.select();
    });
    setScrollToId(null);
  }, [scrollToId, chapters]);

  const handleAddChapter = () => {
    const id = onAddChapter();
    setScrollToId(id);
  };

  let lessonCounter = 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-brand">Chapters</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Scroll between chapters outside; scroll videos inside each chapter.
            Drag lessons by the handle to reorder.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddChapter}
        >
          <FolderPlus className="h-4 w-4 mr-1.5" />
          Add chapter
        </Button>
      </div>

      {/* Outer scroll: move between chapter cards */}
      <div
        ref={outerRef}
        className="space-y-3 max-h-[520px] overflow-y-auto overscroll-contain pr-1"
      >
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            ref={(node) => {
              chapterRefs.current[chapter.id] = node;
            }}
            className="rounded-xl border border-white/[0.08] bg-surface-1/50 overflow-hidden flex flex-col"
            onDragOver={(e) => {
              e.preventDefault();
              if (chapter.lessons.length === 0) {
                setDropTarget({ chapterId: chapter.id, index: 0 });
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (!dragging) return;
              if (chapter.lessons.length === 0) {
                onReorderLesson(
                  dragging.chapterId,
                  dragging.lessonId,
                  chapter.id,
                  0
                );
              } else if (dropTarget?.chapterId === chapter.id) {
                onReorderLesson(
                  dragging.chapterId,
                  dragging.lessonId,
                  dropTarget.chapterId,
                  dropTarget.index
                );
              }
              setDragging(null);
              setDropTarget(null);
            }}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
              <input
                ref={(node) => {
                  titleInputRefs.current[chapter.id] = node;
                }}
                value={chapter.title}
                onChange={(e) => onRenameChapter(chapter.id, e.target.value)}
                className="flex-1 bg-transparent text-sm font-semibold text-text-primary focus:outline-none focus:ring-0"
                aria-label="Chapter title"
              />
              <span className="text-xs text-text-muted shrink-0">
                {chapter.lessons.length} lesson
                {chapter.lessons.length !== 1 ? "s" : ""}
              </span>
              {chapters.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveChapter(chapter.id)}
                  className="p-1.5 text-text-muted hover:text-red-400"
                  title="Remove chapter (lessons move to previous)"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Inner scroll: videos within this chapter only */}
            <div className="p-2 space-y-1 max-h-[200px] overflow-y-auto overscroll-contain">
              {chapter.lessons.length === 0 ? (
                <p className="text-xs text-text-muted px-2 py-3">
                  Empty — drag a lesson here.
                </p>
              ) : (
                chapter.lessons.map((v, li) => {
                  lessonCounter += 1;
                  const n = lessonCounter;
                  const isDropBefore =
                    dropTarget?.chapterId === chapter.id &&
                    dropTarget.index === li &&
                    dragging?.lessonId !== v.id;

                  return (
                    <div key={v.id}>
                      {isDropBefore && (
                        <div className="h-0.5 mx-2 mb-1 rounded-full bg-brand" />
                      )}
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = "move";
                          setDragging({
                            chapterId: chapter.id,
                            lessonId: v.id,
                          });
                        }}
                        onDragEnd={() => {
                          setDragging(null);
                          setDropTarget(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const rect = (
                            e.currentTarget as HTMLElement
                          ).getBoundingClientRect();
                          const before =
                            e.clientY < rect.top + rect.height / 2;
                          setDropTarget({
                            chapterId: chapter.id,
                            index: before ? li : li + 1,
                          });
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!dragging || !dropTarget) return;
                          onReorderLesson(
                            dragging.chapterId,
                            dragging.lessonId,
                            dropTarget.chapterId,
                            dropTarget.index
                          );
                          setDragging(null);
                          setDropTarget(null);
                        }}
                        className={cn(
                          "group flex items-center gap-2 p-2 rounded-lg border border-transparent hover:border-white/[0.06] hover:bg-white/[0.03] cursor-grab active:cursor-grabbing",
                          previewKey?.lessonId === v.id &&
                            "border-brand/40 bg-brand/5",
                          dragging?.lessonId === v.id && "opacity-50"
                        )}
                      >
                        <span
                          className="p-1 text-text-muted shrink-0"
                          title="Drag to reorder"
                          aria-hidden
                        >
                          <GripVertical className="h-4 w-4" />
                        </span>
                        <button
                          type="button"
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                          onClick={() => onPreview(chapter.id, v.id)}
                        >
                          <span className="text-xs text-text-muted w-5 shrink-0">
                            {n}
                          </span>
                          {v.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={v.thumbnail}
                              alt=""
                              className="h-10 w-16 object-cover rounded shrink-0"
                              draggable={false}
                            />
                          ) : (
                            <div className="h-10 w-16 rounded bg-surface-3 flex items-center justify-center shrink-0">
                              <PlayCircle className="h-4 w-4 text-text-muted" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm text-text-primary truncate">
                              {v.title}
                            </p>
                            <p className="text-xs text-text-muted">
                              {v.durationMinutes
                                ? `${v.durationMinutes} min`
                                : "Video"}
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-0.5 shrink-0">
                          {li > 0 && (
                            <button
                              type="button"
                              title="Start new chapter from here"
                              onClick={() => onSplitAt(chapter.id, li)}
                              className="p-1.5 text-text-muted hover:text-brand opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Scissors className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {chapters.length > 1 && (
                            <select
                              className="max-w-[110px] text-[10px] bg-surface-2 border border-white/[0.08] rounded px-1 py-1 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                              value={chapter.id}
                              onChange={(e) =>
                                onMoveLessonToChapter(
                                  chapter.id,
                                  v.id,
                                  e.target.value
                                )
                              }
                              title="Move to chapter"
                            >
                              {chapters.map((c, i) => (
                                <option key={c.id} value={c.id}>
                                  Ch {i + 1}
                                </option>
                              ))}
                            </select>
                          )}
                          <button
                            type="button"
                            onClick={() => onRemoveLesson(chapter.id, v.id)}
                            className="p-1.5 text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove lesson"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {dropTarget?.chapterId === chapter.id &&
                        dropTarget.index === chapter.lessons.length &&
                        li === chapter.lessons.length - 1 &&
                        dragging?.lessonId !== v.id && (
                          <div className="h-0.5 mx-2 mt-1 rounded-full bg-brand" />
                        )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-muted flex items-center gap-1.5">
        <Scissors className="h-3 w-3" />
        Hover a lesson and use scissors to start a new chapter from that video
        downward.
      </p>
    </div>
  );
}
