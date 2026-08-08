"use client";

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

interface LessonVideoPlayerProps {
  url: string;
  title?: string;
}

/** Reliable YouTube embed (iframe) + native <video> fallback for file URLs. */
export function LessonVideoPlayer({ url, title }: LessonVideoPlayerProps) {
  const youtubeId = getYouTubeId(url);

  if (youtubeId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
        title={title || "Lesson video"}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return (
    <video src={url} controls className="w-full h-full" playsInline>
      <track kind="captions" />
    </video>
  );
}
