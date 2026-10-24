import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const FALLBACK_ENDPOINTS = [
  process.env.IDRIVE_ENDPOINT?.trim(),
  "https://s3.ap-south-1.idrivee2.com",
  "https://s3.ap-southeast-2.idrivee2.com",
].filter(Boolean) as string[];

export function getIdriveBucket() {
  return (process.env.IDRIVE_BUCKET || "bharatcloud-backup").trim();
}

function getCredentials() {
  const accessKeyId = process.env.IDRIVE_ACCESS_KEY?.trim() || "";
  const secretAccessKey = process.env.IDRIVE_SECRET_KEY?.trim() || "";
  return { accessKeyId, secretAccessKey };
}

export function isIdriveConfigured() {
  const { accessKeyId, secretAccessKey } = getCredentials();
  return Boolean(accessKeyId && secretAccessKey);
}

function createClient(endpoint: string) {
  const { accessKeyId, secretAccessKey } = getCredentials();
  return new S3Client({
    endpoint,
    region: process.env.IDRIVE_REGION || "ap-south-1",
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

async function withIdriveClient<T>(fn: (client: S3Client, endpoint: string) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (const endpoint of Array.from(new Set(FALLBACK_ENDPOINTS))) {
    try {
      return await fn(createClient(endpoint), endpoint);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("IDrive request failed");
}

export function userPrefix(uid: string) {
  return `${uid.replace(/[^a-zA-Z0-9_-]/g, "_")}/`;
}

export async function uploadUserFile(uid: string, fileName: string, body: Buffer, contentType: string) {
  const key = `${userPrefix(uid)}${fileName.replace(/[/\\]/g, "_")}`;
  await withIdriveClient(async (client) => {
    await client.send(
      new PutObjectCommand({
        Bucket: getIdriveBucket(),
        Key: key,
        Body: body,
        ContentType: contentType || "application/octet-stream",
      }),
    );
  });
  return key;
}

export type ListedFile = {
  key: string;
  name: string;
  size: number;
  lastModified: string | null;
  downloadUrl: string;
};

export async function listUserFiles(uid: string): Promise<{ files: ListedFile[]; totalBytes: number }> {
  const prefix = userPrefix(uid);
  const bucket = getIdriveBucket();

  return withIdriveClient(async (client) => {
    let continuationToken: string | undefined;
    const files: ListedFile[] = [];
    let totalBytes = 0;

    do {
      const out = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      for (const obj of out.Contents || []) {
        if (!obj.Key || obj.Key.endsWith("/")) continue;
        const size = obj.Size || 0;
        totalBytes += size;
        const downloadUrl = await getSignedUrl(
          client,
          new GetObjectCommand({ Bucket: bucket, Key: obj.Key }),
          { expiresIn: 300 },
        );
        files.push({
          key: obj.Key,
          name: obj.Key.slice(prefix.length),
          size,
          lastModified: obj.LastModified?.toISOString() || null,
          downloadUrl,
        });
      }
      continuationToken = out.IsTruncated ? out.NextContinuationToken : undefined;
    } while (continuationToken);

    files.sort((a, b) => (b.lastModified || "").localeCompare(a.lastModified || ""));
    return { files, totalBytes };
  });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
