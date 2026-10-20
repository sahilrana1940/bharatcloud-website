import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { putArchiverObject } from "@/lib/storage/archiver-from-start";
import { getE2EBucket, getE2ECredentials, getE2EEndpoint, getS3Env } from "@/lib/s3/config";

export const B2B_VAULT_BUCKET = getS3Env().b2bBucket;

function omitChecksumHeaders(client: S3Client) {
  client.middlewareStack.add(
    (next) => async (args) => {
      const request = args.request as { headers?: Record<string, string> };
      const headers = request.headers;
      if (headers) {
        for (const name of Object.keys(headers)) {
          if (name.toLowerCase().includes("checksum")) delete headers[name];
        }
      }
      return next(args);
    },
    { step: "build", priority: "low", name: "omitE2eChecksumHeaders", override: true },
  );
}

export function getS3Client(): S3Client | null {
  const endpoint = getE2EEndpoint();
  const { accessKeyId, secretAccessKey } = getE2ECredentials();
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;

  const client = new S3Client({
    forcePathStyle: true,
    endpoint,
    region: "us-east-1",
    credentials: { accessKeyId, secretAccessKey },
    apiVersion: "2006-03-01",
  } as S3ClientConfig);
  omitChecksumHeaders(client);
  return client;
}

export function companyPrefix(companyId: string) {
  return `b2b/${companyId}/`;
}

export async function ensureFolder(
  client: S3Client,
  key: string,
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: B2B_VAULT_BUCKET,
      Key: key.endsWith("/") ? `${key}.keep` : `${key}/.keep`,
      Body: "",
    }),
  );
}

export async function uploadFile(
  _client: S3Client,
  key: string,
  body: Buffer,
  contentType?: string,
) {
  const archiveKey = key.startsWith("archive/") ? key : `archive/drive/${key}`;
  const up = await putArchiverObject({
    key: archiveKey,
    body,
    contentType: contentType || "application/octet-stream",
    bucket: getE2EBucket(),
    metadata: {
      archivedAt: new Date().toISOString(),
      type: "archiver-start",
      retention: "7-years",
    },
  });
  if (!up.ok) throw new Error(up.error);
}

export async function listCompanyFiles(
  client: S3Client,
  companyId: string,
) {
  const prefix = companyPrefix(companyId);
  const out = await client.send(
    new ListObjectsV2Command({
      Bucket: B2B_VAULT_BUCKET,
      Prefix: prefix,
    }),
  );
  return (out.Contents || []).filter(
    (o) => o.Key && !o.Key.endsWith(".keep") && !o.Key.includes("/_trash/"),
  );
}

export async function softDeleteFile(
  client: S3Client,
  companyId: string,
  fileKey: string,
) {
  const trashKey = `${companyPrefix(companyId)}_trash/${Date.now()}-${fileKey.split("/").pop()}`;
  const copy = await client.send(
    new CopyObjectCommand({
      Bucket: B2B_VAULT_BUCKET,
      CopySource: `${B2B_VAULT_BUCKET}/${fileKey}`,
      Key: trashKey,
    }),
  );
  const del = await client.send(
    new DeleteObjectCommand({
      Bucket: B2B_VAULT_BUCKET,
      Key: fileKey,
    }),
  );
  return {
    trashKey,
    versionId: del.VersionId || copy.VersionId || null,
  };
}

export async function restoreFromTrash(
  client: S3Client,
  trashKey: string,
  restoreKey: string,
) {
  await client.send(
    new CopyObjectCommand({
      Bucket: B2B_VAULT_BUCKET,
      CopySource: `${B2B_VAULT_BUCKET}/${trashKey}`,
      Key: restoreKey,
    }),
  );
}

export async function presignedGetUrl(
  client: S3Client,
  key: string,
  expiresInSeconds: number,
) {
  const cmd = new GetObjectCommand({
    Bucket: B2B_VAULT_BUCKET,
    Key: key,
  });
  return getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
}

export function bytesToGb(bytes: number) {
  return Math.round((bytes / 1024 ** 3) * 10) / 10;
}
