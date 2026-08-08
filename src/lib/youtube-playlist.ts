export interface PlaylistVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string | null;
  url: string;
  durationMinutes: number;
  position: number;
}

export interface PlaylistImportResult {
  playlistId: string;
  title: string;
  description: string;
  thumbnail: string | null;
  videoCount: number;
  videos: PlaylistVideo[];
}

/** Clean pasted text (quotes, zero-width chars, angle brackets). */
function cleanPlaylistInput(input: string): string {
  return input
    .trim()
    .replace(/^['"`<]+|['"`>]+$/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

/**
 * Extract playlist ID from common YouTube playlist URL shapes.
 * Accepts full URLs, watch URLs with &list=, or bare playlist IDs.
 */
export function extractPlaylistId(input: string): string | null {
  let trimmed = cleanPlaylistInput(input);
  if (!trimmed) return null;

  // Bare playlist id (PL..., UU..., OL..., RD..., etc.)
  if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed) && /^(PL|UU|LL|FL|RD|OL)/i.test(trimmed)) {
    return trimmed;
  }

  // Allow pasting without protocol: youtube.com/playlist?list=...
  if (!/^https?:\/\//i.test(trimmed) && /youtube\.com|youtu\.be/i.test(trimmed)) {
    trimmed = `https://${trimmed.replace(/^\/\//, "")}`;
  }

  try {
    const url = new URL(trimmed);
    const list = url.searchParams.get("list");
    if (list) return decodeURIComponent(list);
  } catch {
    // fall through
  }

  // Last resort: find list= anywhere in the string
  const match = trimmed.match(/[?&#]list=([A-Za-z0-9_-]+)/i);
  if (match?.[1]) return decodeURIComponent(match[1]);

  // Path style: /playlist/PLxxxx (rare)
  const pathMatch = trimmed.match(/\/playlist\/([A-Za-z0-9_-]+)/i);
  if (pathMatch?.[1]) return pathMatch[1];

  return null;
}

/** True if the input looks like a single video (no playlist). */
export function looksLikeSingleVideoUrl(input: string): boolean {
  const cleaned = cleanPlaylistInput(input);
  if (!cleaned) return false;
  if (/[?&]list=/i.test(cleaned)) return false;
  return (
    /youtube\.com\/watch\?/i.test(cleaned) ||
    /youtu\.be\/[\w-]+/i.test(cleaned) ||
    /youtube\.com\/shorts\//i.test(cleaned)
  );
}

function parseIsoDurationMinutes(iso: string | undefined): number {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const hours = parseInt(m[1] || "0", 10);
  const mins = parseInt(m[2] || "0", 10);
  const secs = parseInt(m[3] || "0", 10);
  return Math.max(1, Math.round(hours * 60 + mins + secs / 60));
}

async function fetchViaYouTubeApi(
  playlistId: string,
  apiKey: string
): Promise<PlaylistImportResult> {
  const metaRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${encodeURIComponent(playlistId)}&key=${apiKey}`,
    { next: { revalidate: 0 } }
  );
  if (!metaRes.ok) {
    throw new Error("YouTube API rejected the playlist request");
  }
  const metaJson = await metaRes.json();
  const playlist = metaJson.items?.[0];
  if (!playlist) {
    throw new Error("Playlist not found or not public");
  }

  const videos: PlaylistVideo[] = [];
  let pageToken = "";

  do {
    const pageUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    pageUrl.searchParams.set("part", "snippet,contentDetails");
    pageUrl.searchParams.set("maxResults", "50");
    pageUrl.searchParams.set("playlistId", playlistId);
    pageUrl.searchParams.set("key", apiKey);
    if (pageToken) pageUrl.searchParams.set("pageToken", pageToken);

    const pageRes = await fetch(pageUrl.toString(), { next: { revalidate: 0 } });
    if (!pageRes.ok) break;
    const pageJson = await pageRes.json();

    for (const item of pageJson.items || []) {
      const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
      if (!videoId || item.snippet?.title === "Deleted video" || item.snippet?.title === "Private video") {
        continue;
      }
      videos.push({
        videoId,
        title: item.snippet.title || `Lesson ${videos.length + 1}`,
        description: item.snippet.description || "",
        thumbnail:
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        durationMinutes: 0,
        position: item.snippet.position ?? videos.length,
      });
    }
    pageToken = pageJson.nextPageToken || "";
  } while (pageToken && videos.length < 200);

  // Optional durations (batched)
  const ids = videos.map((v) => v.videoId);
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const durRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(",")}&key=${apiKey}`,
      { next: { revalidate: 0 } }
    );
    if (!durRes.ok) continue;
    const durJson = await durRes.json();
    const map = new Map<string, number>();
    for (const item of durJson.items || []) {
      map.set(item.id, parseIsoDurationMinutes(item.contentDetails?.duration));
    }
    for (const v of videos) {
      if (map.has(v.videoId)) v.durationMinutes = map.get(v.videoId)!;
    }
  }

  return {
    playlistId,
    title: playlist.snippet?.title || "YouTube Playlist",
    description: playlist.snippet?.description || "",
    thumbnail:
      playlist.snippet?.thumbnails?.medium?.url ||
      playlist.snippet?.thumbnails?.default?.url ||
      videos[0]?.thumbnail ||
      null,
    videoCount: videos.length,
    videos,
  };
}

const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.jing.rocks",
  "https://yewtu.be",
  "https://invidious.fdn.fr",
];

async function fetchViaInvidious(playlistId: string): Promise<PlaylistImportResult> {
  let lastError: Error | null = null;

  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${base}/api/v1/playlists/${encodeURIComponent(playlistId)}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) {
        lastError = new Error(`Invidious ${base} returned ${res.status}`);
        continue;
      }
      const data = await res.json();
      const videos: PlaylistVideo[] = (data.videos || [])
        .filter((v: { videoId?: string; title?: string }) => v.videoId && v.title !== "[Deleted video]")
        .map(
          (
            v: {
              videoId: string;
              title: string;
              lengthSeconds?: number;
              videoThumbnails?: { url: string }[];
            },
            index: number
          ) => ({
            videoId: v.videoId,
            title: v.title || `Lesson ${index + 1}`,
            description: "",
            thumbnail:
              v.videoThumbnails?.[0]?.url ||
              `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${v.videoId}`,
            durationMinutes: v.lengthSeconds
              ? Math.max(1, Math.round(v.lengthSeconds / 60))
              : 0,
            position: index,
          })
        );

      if (videos.length === 0) {
        lastError = new Error("Playlist is empty or private");
        continue;
      }

      return {
        playlistId,
        title: data.title || "YouTube Playlist",
        description: data.description || "",
        thumbnail:
          data.playlistThumbnail ||
          videos[0]?.thumbnail ||
          null,
        videoCount: videos.length,
        videos,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Invidious fetch failed");
    }
  }

  throw lastError || new Error("Could not import playlist");
}

/**
 * Import a public YouTube playlist.
 * Uses YOUTUBE_API_KEY when set; otherwise falls back to Invidious mirrors.
 */
export async function importYouTubePlaylist(urlOrId: string): Promise<PlaylistImportResult> {
  const playlistId = extractPlaylistId(urlOrId);
  if (!playlistId) {
    if (looksLikeSingleVideoUrl(urlOrId)) {
      throw new Error(
        "That looks like a single video link, not a playlist. Open the playlist on YouTube, then copy the URL from the address bar — it must include list=PL..."
      );
    }
    throw new Error(
      "Could not find a playlist id in that link. Use a URL like: https://www.youtube.com/playlist?list=PLxxxxx"
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      return await fetchViaYouTubeApi(playlistId, apiKey);
    } catch (err) {
      console.warn("YouTube API import failed, trying Invidious:", err);
    }
  }

  return fetchViaInvidious(playlistId);
}

/** Split a flat video list into chapters of roughly `chunkSize` lessons. */
export function chunkVideosIntoChapters(
  videos: PlaylistVideo[],
  chunkSize = 6
): { title: string; lessons: PlaylistVideo[] }[] {
  if (videos.length === 0) return [];
  if (videos.length <= chunkSize) {
    return [{ title: "Course Content", lessons: videos }];
  }
  const chapters: { title: string; lessons: PlaylistVideo[] }[] = [];
  for (let i = 0; i < videos.length; i += chunkSize) {
    const slice = videos.slice(i, i + chunkSize);
    chapters.push({
      title: `Chapter ${chapters.length + 1}`,
      lessons: slice,
    });
  }
  return chapters;
}
