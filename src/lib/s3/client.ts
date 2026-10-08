import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getS3Env, isS3Configured } from "@/lib/s3/config";

export const B2B_VAULT_BUCKET = getS3Env().b2bBucket;

export function getS3Client(): S3Client | null {
  if (!isS3Configured()) return null;
  const { endpoint, region, accessKeyId, secretAccessKey } = getS3Env();
  return new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
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
  client: S3Client,
  key: string,
  body: Buffer,
  contentType?: string,
) {
  await client.send(
    new PutObjectCommand({
      Bucket: B2B_VAULT_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
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
