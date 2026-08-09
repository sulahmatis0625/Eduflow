"use client";

import { useEffect, useId, useRef } from "react";

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "").split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/")[2] || null;
      }
      return u.searchParams.get("v");
    }
  } catch {
    // fall through
  }
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
  );
  return match?.[1] ?? null;
}

type YTPlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getPlayerState: () => number;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: Record<string, unknown>
      ) => YTPlayer;
      PlayerState: { PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.getElementById("yt-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    if (window.YT?.Player) resolve();
  });

  return ytApiPromise;
}

export interface WatchProgressUpdate {
  /** Furthest continuously watched second (resume + 90% gate) */
  watchTime: number;
  duration: number;
  percent: number;
}

interface LessonVideoPlayerProps {
  url: string;
  title?: string;
  /** Resume position in seconds */
  initialWatchTime?: number;
  onProgress?: (update: WatchProgressUpdate) => void;
}

/** YouTube IFrame API player with watch tracking + native <video> fallback. */
export function LessonVideoPlayer({
  url,
  title,
  initialWatchTime = 0,
  onProgress,
}: LessonVideoPlayerProps) {
  const youtubeId = getYouTubeId(url);
  const reactId = useId().replace(/:/g, "");
  const containerId = `yt-player-${reactId}`;
  const playerRef = useRef<YTPlayer | null>(null);
  const maxWatchedRef = useRef(Math.max(0, initialWatchTime));
  const durationRef = useRef(0);
  const onProgressRef = useRef(onProgress);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const resumedRef = useRef(false);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    maxWatchedRef.current = Math.max(0, initialWatchTime);
    resumedRef.current = false;
  }, [url, initialWatchTime]);

  const emitProgress = (current: number, duration: number) => {
    if (!duration || duration <= 0) return;
    durationRef.current = duration;

    // Only advance "watched" when playing near the frontier (blocks skip-ahead)
    if (
      current > maxWatchedRef.current &&
      current <= maxWatchedRef.current + 8
    ) {
      maxWatchedRef.current = current;
    }

    const watchTime = Math.floor(maxWatchedRef.current);
    const percent = Math.min(
      100,
      Math.round((maxWatchedRef.current / duration) * 100)
    );
    onProgressRef.current?.({ watchTime, duration, percent });
  };

  // YouTube player
  useEffect(() => {
    if (!youtubeId) return;
    let cancelled = false;
    let pollId: number | undefined;

    loadYouTubeAPI().then(() => {
      if (cancelled || !window.YT?.Player) return;
      const el = document.getElementById(containerId);
      if (!el) return;

      playerRef.current = new window.YT.Player(containerId, {
        videoId: youtubeId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (event: { target: YTPlayer }) => {
            const player = event.target;
            playerRef.current = player;
            const duration = player.getDuration() || 0;
            durationRef.current = duration;
            if (!resumedRef.current && initialWatchTime > 5 && duration > 0) {
              const resumeAt = Math.min(initialWatchTime, Math.max(0, duration - 2));
              player.seekTo(resumeAt, true);
              maxWatchedRef.current = Math.max(
                maxWatchedRef.current,
                resumeAt
              );
              resumedRef.current = true;
            }
            emitProgress(maxWatchedRef.current, duration || 1);
          },
          onStateChange: () => {
            // polling handles progress while playing
          },
        },
      });

      pollId = window.setInterval(() => {
        const player = playerRef.current;
        if (!player?.getCurrentTime) return;
        try {
          const state = player.getPlayerState?.();
          // 1 = PLAYING
          if (state !== 1) return;
          const current = player.getCurrentTime() || 0;
          const duration = player.getDuration() || durationRef.current || 0;
          emitProgress(current, duration);
        } catch {
          // player torn down
        }
      }, 2000);
    });

    return () => {
      cancelled = true;
      if (pollId) window.clearInterval(pollId);
      try {
        playerRef.current?.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount on video change
  }, [youtubeId, containerId]);

  if (youtubeId) {
    return (
      <div className="absolute inset-0 w-full h-full">
        <div id={containerId} className="w-full h-full" title={title || "Lesson video"} />
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={url}
      controls
      className="w-full h-full"
      playsInline
      onLoadedMetadata={(e) => {
        const v = e.currentTarget;
        durationRef.current = v.duration || 0;
        if (!resumedRef.current && initialWatchTime > 5) {
          v.currentTime = Math.min(
            initialWatchTime,
            Math.max(0, (v.duration || 0) - 2)
          );
          maxWatchedRef.current = Math.max(
            maxWatchedRef.current,
            v.currentTime
          );
          resumedRef.current = true;
        }
        emitProgress(maxWatchedRef.current, v.duration || 1);
      }}
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        emitProgress(v.currentTime, v.duration || durationRef.current || 0);
      }}
    >
      <track kind="captions" />
    </video>
  );
}
