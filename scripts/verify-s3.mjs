/**
 * Smoke-test S3-compatible storage (Wasabi / E2E).
 * Loads .env.local then .env from repo root (no extra deps).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ListBucketsCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";

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

const endpoint =
  process.env.WASABI_ENDPOINT || process.env.E2E_S3_ENDPOINT || "";
const region =
  process.env.WASABI_REGION || process.env.E2E_S3_REGION || "us-east-1";
const accessKeyId =
  process.env.WASABI_ACCESS_KEY || process.env.E2E_S3_ACCESS_KEY || "";
const secretAccessKey =
  process.env.WASABI_SECRET_KEY || process.env.E2E_S3_SECRET_KEY || "";
const bucket =
  process.env.WASABI_B2B_BUCKET ||
  process.env.E2E_S3_B2B_BUCKET ||
  "bharatcloud-vault";

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error(
    "Missing storage env. Set WASABI_* (or E2E_S3_*) in .env.local — see docs/hostinger-wasabi.md",
  );
  process.exit(1);
}

const client = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

try {
  const buckets = await client.send(new ListBucketsCommand({}));
  console.log("OK list buckets:", (buckets.Buckets || []).map((b) => b.Name));
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log(`OK head bucket: ${bucket}`);
} catch (err) {
  console.error("S3 check failed:", err.message || err);
  process.exit(1);
}
