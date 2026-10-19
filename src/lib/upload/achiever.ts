/**
 * Shrink a file before it is stored on E2E.
 * Images: WebP, max 1920px, quality 0.8, target under 1 MB.
 * PDFs: object streams.
 * Video: unchanged here. Server pass later is ffmpeg.wasm at 720p / 1500k.
 * `saved` is bytes removed (original size minus stored size).
 */

export async function achieverReduce(file: File): Promise<{ file: File; saved: number }> {
  const original = file.size;
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();

  try {
    if (type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(name)) {
      const next = await compressImage(file);
      return { file: next, saved: Math.max(0, original - next.size) };
    }
    if (type === "application/pdf" || name.endsWith(".pdf")) {
      const next = await compressPdf(file);
      return { file: next, saved: Math.max(0, original - next.size) };
    }
    if (type.startsWith("video/") || /\.(mp4|mov|webm|mkv)$/i.test(name)) {
      return { file, saved: 0 };
    }
  } catch {
    return { file, saved: 0 };
  }

  return { file, saved: 0 };
}

async function compressImage(file: File): Promise<File> {
  if (typeof window !== "undefined") {
    const imageCompression = (await import("browser-image-compression")).default;
    return imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      fileType: "image/webp",
      initialQuality: 0.8,
      useWebWorker: true,
    });
  }

  const sharp = (await import("sharp")).default;
  const input = Buffer.from(await file.arrayBuffer());
  const output = await sharp(input)
    .rotate()
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  const copy = new Uint8Array(output);
  const base = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([copy], `${base}.webp`, { type: "image/webp" });
}

async function compressPdf(file: File): Promise<File> {
  const { PDFDocument } = await import("pdf-lib");
  const input = await file.arrayBuffer();
  const doc = await PDFDocument.load(input, { ignoreEncryption: true });
  const bytes = await doc.save({ useObjectStreams: true });
  const copy = new Uint8Array(bytes);
  return new File([copy], file.name.endsWith(".pdf") ? file.name : `${file.name}.pdf`, {
    type: "application/pdf",
  });
}
