import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";

import { calculateBill, E2E_RATES } from "@/lib/admin/platform-costs";
import { getE2EBucket } from "@/lib/s3/config";

export { calculateBill, E2E_RATES };

/** Single E2E client. Bucket and endpoint come from env, never a hardcoded name. */
export function getE2EClient(): S3Client | null {
  const endpoint = (process.env.E2E_ENDPOINT || process.env.E2E_S3_ENDPOINT || "").trim();
  const accessKeyId = (process.env.E2E_ACCESS_KEY || process.env.E2E_S3_ACCESS_KEY || "").trim();
  const secretAccessKey = (process.env.E2E_SECRET_KEY || process.env.E2E_S3_SECRET_KEY || "").trim();
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: "us-east-1",
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  } as S3ClientConfig);
}

export function bucketForKey(_key: string): string {
  return getE2EBucket();
}

/** Upload always lands in the env bucket as an archive copy. */
export async function uploadToE2E(
  file: File,
  orgId: string,
): Promise<{ bucket: string; key: string }> {
  if (!getE2EClient()) {
    throw new Error("E2E credentials missing. Set E2E_ENDPOINT, E2E_ACCESS_KEY and E2E_SECRET_KEY.");
  }
  const { uploadAsArchiver } = await import("@/lib/storage/archiver-from-start");
  return uploadAsArchiver(file, orgId, null, "drive");
}
