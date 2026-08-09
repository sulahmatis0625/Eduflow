import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  importYouTubeVideo,
  importYouTubeVideos,
} from "@/lib/youtube-playlist";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const urls: string[] = Array.isArray(body.urls)
      ? body.urls
      : body.url
        ? [body.url]
        : [];

    if (urls.length === 0) {
      return NextResponse.json(
        { error: "Video URL is required" },
        { status: 400 }
      );
    }

    if (urls.length === 1) {
      const video = await importYouTubeVideo(urls[0]);
      return NextResponse.json({ video, videos: [video] });
    }

    const videos = await importYouTubeVideos(urls);
    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Video import error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to import video";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
