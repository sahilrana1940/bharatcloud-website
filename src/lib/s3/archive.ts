import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  driveArchiveKey,
  putArchiverObject,
} from "@/lib/storage/archiver-from-start";
import { getS3Client } from "@/lib/s3/client";
import { getArchiveBucket, isS3Configured } from "@/lib/s3/config";

export { driveArchiveKey as archiveObjectKey };

export async function uploadToArchive(
  key: string,
  body: Buffer,
  contentType: string,
  meta?: { originalName?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const up = await putArchiverObject({
    key,
    body,
    contentType,
    metadata: meta?.originalName
      ? {
          archivedAt: new Date().toISOString(),
          originalName: meta.originalName,
          retention: "7-years",
          type: "archiver-start",
        }
      : {
          archivedAt: new Date().toISOString(),
          retention: "7-years",
          type: "archiver-start",
        },
  });
  return up.ok ? { ok: true } : { ok: false, error: up.error };
}

export async function presignedArchiveGetUrl(
  key: string,
  expiresInSeconds = 3600,
  bucket?: string,
): Promise<string | null> {
  if (!key || !isS3Configured()) return null;
  const client = getS3Client();
  if (!client) return null;
  const b = bucket || getArchiveBucket();
  const cmd = new GetObjectCommand({ Bucket: b, Key: key });
  return getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
}

export async function getArchiveObjectUrl(key: string, bucket?: string) {
  return presignedArchiveGetUrl(key, 3600, bucket);
}
