import { prepareUploadBody } from "@/lib/storage/compress-upload";

/** Images → WebP via sharp. Videos: pass-through on serverless (optional ffmpeg later). */
export async function compressForArchive(
  buffer: Buffer,
  mimeType: string | null | undefined,
  fileName: string,
): Promise<{ body: Buffer; contentType: string; outName: string }> {
  const mime = mimeType || "application/octet-stream";
  const prepared = await prepareUploadBody(buffer, mime);
  let outName = fileName;
  if (prepared.fileNameSuffix) {
    const base = fileName.replace(/\.[^.]+$/, "");
    outName = `${base}.webp`;
  }
  if (mime.startsWith("video/")) {
    return { body: buffer, contentType: mime, outName: fileName };
  }
  return {
    body: prepared.body,
    contentType: prepared.contentType,
    outName,
  };
}
