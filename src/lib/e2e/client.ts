import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { calculateBill, E2E_RATES } from "@/lib/admin/platform-costs";

export { calculateBill, E2E_RATES };

const HOT_BUCKET = "bharatcloud-hot";
const COLD_BUCKET = "bharatcloud-cold";

export function getE2EClient(): S3Client | null {
  const accessKeyId = (
    process.env.E2E_ACCESS_KEY ||
    process.env.E2E_S3_ACCESS_KEY ||
    process.env.E2E_S3_ACCESS_KEY_ID ||
    ""
  ).trim();
  const secretAccessKey = (
    process.env.E2E_SECRET_KEY ||
    process.env.E2E_S3_SECRET_KEY ||
    process.env.E2E_S3_SECRET_ACCESS_KEY ||
    ""
  ).trim();
  if (!accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    endpoint: (process.env.E2E_S3_ENDPOINT || "https://mumbai.e2e.cloud").trim(),
    region: (process.env.E2E_S3_REGION || "mumbai").trim(),
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function bucketForKey(key: string): string {
  return key.includes("/archive/") ? COLD_BUCKET : HOT_BUCKET;
}

export async function uploadToE2E(file: File, key: string): Promise<{ bucket: string; key: string }> {
  const client = getE2EClient();
  if (!client) {
    throw new Error("E2E credentials missing. Set E2E_ACCESS_KEY and E2E_SECRET_KEY.");
  }
  const bucket = bucketForKey(key);
  const body = Buffer.from(await file.arrayBuffer());
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: file.type || "application/octet-stream",
    }),
  );
  return { bucket, key };
}
