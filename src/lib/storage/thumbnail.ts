import sharp from "sharp";

export async function generateWebpThumb(buffer: Buffer, max = 200) {
  return sharp(buffer)
    .rotate()
    .resize(max, max, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 60 })
    .toBuffer();
}

export function thumbObjectPath(email: string, fileName: string) {
  const safe = fileName.replace(/[/\\]/g, "_");
  return `${email.toLowerCase()}/thumb_${Date.now()}_${safe}.webp`;
}
