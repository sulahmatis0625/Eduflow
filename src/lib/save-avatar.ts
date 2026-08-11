import { mkdir, writeFile } from "fs/promises";
import path from "path";

/** Persist a data-URL image to public/uploads/avatars and return a public path. */
export async function saveAvatarDataUrl(
  userId: string,
  dataUrl: string
): Promise<string> {
  const match = dataUrl.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/i);
  if (!match) {
    throw new Error("Invalid image data");
  }

  const ext = match[2].toLowerCase() === "jpg" ? "jpg" : match[2].toLowerCase();
  const buffer = Buffer.from(match[3], "base64");
  if (buffer.length > 700_000) {
    throw new Error("Image is too large");
  }

  const dir = path.join(process.cwd(), "public", "uploads", "avatars");
  await mkdir(dir, { recursive: true });

  const filename = `${userId}-${Date.now()}.${ext}`;
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/avatars/${filename}`;
}
