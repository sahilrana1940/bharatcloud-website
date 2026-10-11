import { PutObjectCommand, type StorageClass } from "@aws-sdk/client-s3";

import { getS3Client } from "@/lib/s3/client";
import { getArchiveBucket, isS3Configured } from "@/lib/s3/config";

export function archiveObjectKey(companyId: string, fileName: string) {
  const safe = fileName.replace(/[/\\]/g, "_");
  return `${companyId}/${Date.now()}_${safe}`;
}

export async function uploadToArchive(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isS3Configured()) {
    return { ok: false, error: "S3 not configured (WASABI_* or E2E_S3_*)" };
  }
  const client = getS3Client();
  if (!client) return { ok: false, error: "S3 client unavailable" };

  const bucket = getArchiveBucket();
  try {
    const storageClass = process.env.ARCHIVE_S3_STORAGE_CLASS?.trim() as StorageClass | undefined;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ...(storageClass ? { StorageClass: storageClass } : {}),
      }),
    );
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return { ok: false, error: msg };
  }
}
