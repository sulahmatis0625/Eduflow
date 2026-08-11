import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { importYouTubePlaylist } from "@/lib/youtube-playlist";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Playlist URL is required" }, { status: 400 });
    }

    const playlist = await importYouTubePlaylist(url);
    return NextResponse.json(playlist);
  } catch (error) {
    console.error("Playlist import error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to import playlist";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
