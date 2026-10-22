/**
 * Smoke-test S3-compatible storage (Wasabi / E2E).
 * Loads .env.local then .env from repo root (no extra deps).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(name) {
  const path = resolve(root, name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const DELHI = "https://objectstore.e2enetworks.net";
const configuredEndpoint = (
  process.env.E2E_ENDPOINT ||
  process.env.E2E_S3_ENDPOINT ||
  process.env.WASABI_ENDPOINT ||
  ""
).trim();
const endpoint = /mumbai|mum-objectstore|ap-mumbai/i.test(configuredEndpoint)
  ? DELHI
  : configuredEndpoint || DELHI;
const configuredRegion = (
  process.env.E2E_REGION ||
  process.env.E2E_S3_REGION ||
  process.env.WASABI_REGION ||
  "us-east-1"
).trim();
const region = /mumbai/i.test(configuredRegion) ? "us-east-1" : configuredRegion;
const accessKeyId =
  process.env.E2E_ACCESS_KEY ||
  process.env.E2E_S3_ACCESS_KEY ||
  process.env.E2E_S3_ACCESS_KEY_ID ||
  process.env.WASABI_ACCESS_KEY ||
  "";
const secretAccessKey =
  process.env.E2E_SECRET_KEY ||
  process.env.E2E_S3_SECRET_KEY ||
  process.env.E2E_S3_SECRET_ACCESS_KEY ||
  process.env.WASABI_SECRET_KEY ||
  "";
const rawBucket =
  process.env.E2E_BUCKET_NAME ||
  process.env.E2E_BUCKET ||
  process.env.E2E_S3_B2B_BUCKET ||
  process.env.ARCHIVE_S3_BUCKET ||
  process.env.WASABI_B2B_BUCKET ||
  "bharatcloudfinal2";
const bucket = rawBucket.trim() === "bharacloudfinal2" ? "bharatcloudfinal2" : rawBucket.trim();

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error(
    "Missing storage env. Set E2E_ENDPOINT, E2E_ACCESS_KEY, E2E_SECRET_KEY, and E2E_BUCKET_NAME in the host env or .env.local.",
  );
  process.exit(1);
}

const client = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

function logS3Error(op, err) {
  const code = err.Code || err.name || "S3Error";
  console.error(`[e2e-storage] ${code} during ${op}`, {
    code,
    message: err.message,
    httpStatus: err.$metadata?.httpStatusCode,
    requestId: err.$metadata?.requestId,
    bucket,
    endpoint,
    region,
  });
}

try {
  const listed = await client.send(new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 }));
  const sample = listed.KeyCount ?? (listed.Contents || []).length;
  console.log(`OK list bucket: ${bucket} endpoint=${endpoint} region=${region} sampleKeys=${sample}`);
} catch (err) {
  const code = err.Code || err.name || "S3Error";
  logS3Error("ListObjectsV2", err);
  if (code === "AccessDenied" || err.$metadata?.httpStatusCode === 403) {
    console.error(
      `[e2e-storage] AccessDenied for bucket "${bucket}" on ${endpoint}. Grant the key named "bharat" ListBucket, or set E2E_ENDPOINT to the region where that key was created.`,
    );
  }
  if (code === "InvalidAccessKeyId") {
    console.error(
      "[e2e-storage] InvalidAccessKeyId. Delhi keys use https://objectstore.e2enetworks.net. Chennai keys use https://in-south1-objectstore.e2enetworks.net.",
    );
  }
  process.exit(1);
}
