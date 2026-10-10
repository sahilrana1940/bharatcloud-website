import sharp from "sharp";

export async function prepareUploadBody(
  buffer: Buffer,
  mimeType?: string | null,
): Promise<{ body: Buffer; contentType: string; fileNameSuffix?: string }> {
  if (mimeType?.startsWith("image/") && mimeType !== "image/webp") {
    const webp = await sharp(buffer).webp({ quality: 82 }).toBuffer();
    return { body: webp, contentType: "image/webp", fileNameSuffix: ".webp" };
  }
  return {
    body: buffer,
    contentType: mimeType || "application/octet-stream",
  };
}
