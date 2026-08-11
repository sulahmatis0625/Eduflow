/**
 * Courses where Mark Complete skips the 90% watch requirement (demo / long playlists).
 */
const DEMO_SKIP_WATCH_GATE_SLUGS = new Set([
  "front-end-developer-learning-path",
]);

export function courseSkipsWatchGate(
  slug: string | null | undefined,
  title?: string | null
): boolean {
  if (slug && DEMO_SKIP_WATCH_GATE_SLUGS.has(slug)) return true;
  const t = (title || "").toLowerCase();
  // freeCodeCamp Front End path (seeded or re-uploaded under a similar name)
  if (t.includes("front end developer learning path")) return true;
  if (t.includes("freecodecamp") && t.includes("front")) return true;
  return false;
}
