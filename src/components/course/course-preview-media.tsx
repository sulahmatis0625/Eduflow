"use client";

import { useState } from "react";
import { BookOpen, PlayCircle } from "lucide-react";
import { LessonVideoPlayer } from "@/components/course/lesson-video-player";

interface CoursePreviewMediaProps {
  title: string;
  thumbnail: string | null;
  previewVideo: string | null;
}

/** Thumbnail with optional YouTube preview — click to play in place. */
export function CoursePreviewMedia({
  title,
  thumbnail,
  previewVideo,
}: CoursePreviewMediaProps) {
  const [playing, setPlaying] = useState(false);

  if (playing && previewVideo) {
    return (
      <div className="relative aspect-video bg-black overflow-hidden">
        <LessonVideoPlayer url={previewVideo} title={`${title} preview`} />
      </div>
    );
  }

  return (
    <div className="relative h-52 bg-gradient-to-br from-surface-3 to-surface-2 overflow-hidden">
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <BookOpen className="h-16 w-16 text-text-muted" />
        </div>
      )}
      {previewVideo && (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors cursor-pointer"
          aria-label="Play course preview"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-3 border border-white/[0.08]">
            <PlayCircle className="h-8 w-8 text-brand" />
          </div>
        </button>
      )}
    </div>
  );
}
