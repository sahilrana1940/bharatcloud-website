import {
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";

const HOT_BUCKET = process.env.E2E_S3_HOT_BUCKET || "bharatcloud-b2c-hot";
const COLD_BUCKET = process.env.E2E_S3_COLD_BUCKET || "bharatcloud-b2c-cold";
const ARCHIVE_BUCKET =
  process.env.E2E_S3_ARCHIVE_BUCKET || "bharatcloud-b2c-archive";

const HOT_MAX_DAYS = 15;
const ARCHIVE_MIN_DAYS = 60;

function createS3Client() {
  const endpoint = process.env.E2E_S3_ENDPOINT;
  if (!endpoint) {
    return null;
  }
  return new S3Client({
    endpoint,
    region: process.env.E2E_S3_REGION || "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.E2E_S3_ACCESS_KEY || "",
      secretAccessKey: process.env.E2E_S3_SECRET_KEY || "",
    },
  });
}

function ageInDays(date) {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

async function listAllKeys(client, bucket) {
  const keys = [];
  let token;
  do {
    const out = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: token,
      }),
    );
    for (const item of out.Contents || []) {
      if (item.Key) keys.push({ key: item.Key, lastModified: item.LastModified });
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function moveObject(client, sourceBucket, destBucket, key) {
  await client.send(
    new CopyObjectCommand({
      Bucket: destBucket,
      Key: key,
      CopySource: `${sourceBucket}/${encodeURIComponent(key).replace(/%2F/g, "/")}`,
    }),
  );
  await client.send(
    new DeleteObjectCommand({
      Bucket: sourceBucket,
      Key: key,
    }),
  );
}

/**
 * LSS: 0–15 days HOT, 15–60 days COLD, 60+ days ARCHIVE.
 */
export async function runLssLifecycle() {
  const client = createS3Client();
  if (!client) {
    console.warn("[lss] E2E_S3_ENDPOINT not set; skipping lifecycle run");
    return { skipped: true, movedHotToCold: 0, movedColdToArchive: 0 };
  }

  let movedHotToCold = 0;
  let movedColdToArchive = 0;

  const hotObjects = await listAllKeys(client, HOT_BUCKET);
  for (const obj of hotObjects) {
    if (!obj.lastModified) continue;
    if (ageInDays(obj.lastModified) >= HOT_MAX_DAYS) {
      await moveObject(client, HOT_BUCKET, COLD_BUCKET, obj.key);
      movedHotToCold += 1;
    }
  }

  const coldObjects = await listAllKeys(client, COLD_BUCKET);
  for (const obj of coldObjects) {
    if (!obj.lastModified) continue;
    if (ageInDays(obj.lastModified) >= ARCHIVE_MIN_DAYS) {
      await moveObject(client, COLD_BUCKET, ARCHIVE_BUCKET, obj.key);
      movedColdToArchive += 1;
    }
  }

  console.log(
    `[lss] hot→cold: ${movedHotToCold}, cold→archive: ${movedColdToArchive}`,
  );
  return { skipped: false, movedHotToCold, movedColdToArchive };
}
