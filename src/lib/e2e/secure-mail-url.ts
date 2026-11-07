import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getE2EClient } from "@/lib/e2e/client";
import { getE2EBucket, isS3Configured } from "@/lib/s3/config";

/** Presigned GET lifetime for archived .eml (5 minutes). */
export const SECURE_MAIL_URL_TTL_SECONDS = 300;

/**
 * Short-lived download URL for a private archived mail object on E2E.
 * Uses E2E_ENDPOINT / E2E_ACCESS_KEY / E2E_SECRET_KEY from env (not hardcoded).
 */
export async function getSecureMailUrl(
  key: string,
  opts?: { bucket?: string; expiresIn?: number },
): Promise<string | null> {
  const objectKey = key?.trim();
  if (!objectKey || !isS3Configured()) return null;

  const client = getE2EClient();
  if (!client) return null;

  const bucket = (opts?.bucket || getE2EBucket()).replace(/\s+/g, "");
  const command = new GetObjectCommand({ Bucket: bucket, Key: objectKey });
  return getSignedUrl(client, command, {
    expiresIn: opts?.expiresIn ?? SECURE_MAIL_URL_TTL_SECONDS,
  });
}
