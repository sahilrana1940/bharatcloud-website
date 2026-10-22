import { createHash, createHmac } from "node:crypto";

import { E2E_CHENNAI_ENDPOINT, getE2ECredentials, getE2EEndpoint, getE2ERegion } from "@/lib/s3/config";

/** Hosts to try, in order. The last one accepts this key. The others time out or reset TLS. */
const HOSTS = [
  "https://objectstorage.chn1.e2e.co.in",
  "https://objectstorage.e2e.co.in",
  E2E_CHENNAI_ENDPOINT,
];

let pinned: { endpoint: string; pathStyle: boolean } | null = null;

function sha256(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

function encodePath(value: string) {
  return value
    .split("/")
    .map((part) =>
      encodeURIComponent(part).replace(/[!'()*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`),
    )
    .join("/");
}

function candidates() {
  if (pinned) return [pinned];
  const list: { endpoint: string; pathStyle: boolean }[] = [];
  const seen = new Set<string>();
  const endpoints = [...HOSTS];
  const configured = getE2EEndpoint().replace(/\/$/, "");
  if (configured) endpoints.push(configured);
  for (const endpoint of endpoints) {
    for (const pathStyle of [true, false]) {
      const key = `${endpoint}|${pathStyle}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ endpoint, pathStyle });
    }
  }
  return list;
}

function failureText(err: unknown) {
  if (!(err instanceof Error)) return String(err);
  const cause =
    err.cause && typeof err.cause === "object"
      ? String(
          (err.cause as { code?: string; message?: string }).code ||
            (err.cause as { message?: string }).message ||
            "",
        )
      : "";
  return cause ? `${err.message}: ${cause}` : err.message;
}

async function signedFetch(opts: {
  endpoint: string;
  pathStyle: boolean;
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
  storageClass?: string;
  metadata?: Record<string, string>;
}) {
  const { accessKeyId, secretAccessKey } = getE2ECredentials();
  const region = getE2ERegion();
  const host = new URL(opts.endpoint).host;
  const requestHost = opts.pathStyle ? host : `${opts.bucket}.${host}`;
  const canonicalUri = opts.pathStyle
    ? `/${encodePath(`${opts.bucket}/${opts.key}`)}`
    : `/${encodePath(opts.key)}`;
  const url = `https://${requestHost}${canonicalUri}`;
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(opts.body);
  const headers: Record<string, string> = {
    host: requestHost,
    "content-type": opts.contentType,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  if (opts.storageClass) headers["x-amz-storage-class"] = opts.storageClass;
  for (const [name, value] of Object.entries(opts.metadata || {})) {
    headers[`x-amz-meta-${name.toLowerCase()}`] = value.replace(/[\r\n]/g, " ");
  }
  const names = Object.keys(headers).sort();
  const canonicalHeaders = names.map((name) => `${name}:${headers[name].trim()}\n`).join("");
  const signedHeaders = names.join(";");
  const canonical = ["PUT", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonical)].join("\n");
  let key = createHmac("sha256", `AWS4${secretAccessKey}`).update(dateStamp).digest();
  key = createHmac("sha256", key).update(region).digest();
  key = createHmac("sha256", key).update("s3").digest();
  key = createHmac("sha256", key).update("aws4_request").digest();
  const signature = createHmac("sha256", key).update(stringToSign).digest("hex");
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      ...headers,
      authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    body: new Uint8Array(opts.body),
    signal: AbortSignal.timeout(6_000),
  });
  const text = await res.text();
  return { status: res.status, text };
}

export async function putObjectSigned(opts: {
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
  storageClass?: string;
  metadata?: Record<string, string>;
}): Promise<{ ok: true; endpoint: string } | { ok: false; error: string }> {
  const { accessKeyId, secretAccessKey } = getE2ECredentials();
  if (!accessKeyId || !secretAccessKey) return { ok: false, error: "E2E credentials missing" };

  let lastError = "Archive upload failed";
  const unreachable = new Set<string>();
  for (const target of candidates()) {
    if (unreachable.has(target.endpoint)) continue;
    const classes = opts.storageClass ? [opts.storageClass, ""] : [""];
    for (const storageClass of classes) {
      console.error(
        "E2E_DEBUG",
        JSON.stringify({
          endpoint: target.endpoint,
          pathStyle: target.pathStyle,
          bucket: opts.bucket,
          file: opts.key,
          storageClass: storageClass || null,
          transport: "fetch-sigv4",
        }),
      );
      try {
        const sent = await signedFetch({ ...opts, ...target, storageClass: storageClass || undefined });
        if (sent.status >= 200 && sent.status < 300) {
          pinned = target;
          console.error("E2E_DEBUG", JSON.stringify({ ok: true, endpoint: target.endpoint, file: opts.key }));
          return { ok: true, endpoint: target.endpoint };
        }
        const detail = sent.text.replace(/\s+/g, " ").slice(0, 400);
        lastError = `E2E PUT ${sent.status}: ${detail || "empty body"}`;
        console.error(
          "E2E_FAIL_FULL",
          JSON.stringify({
            endpoint: target.endpoint,
            pathStyle: target.pathStyle,
            bucket: opts.bucket,
            file: opts.key,
            storageClass: storageClass || null,
            status: sent.status,
            body: detail,
          }),
        );
        if (!/invalid storage class|InvalidStorageClass/i.test(detail)) break;
      } catch (err) {
        lastError = failureText(err);
        console.error(
          "E2E_FAIL_FULL",
          JSON.stringify({
            endpoint: target.endpoint,
            pathStyle: target.pathStyle,
            bucket: opts.bucket,
            file: opts.key,
            storageClass: storageClass || null,
            status: 0,
            body: lastError,
          }),
        );
        unreachable.add(target.endpoint);
        break;
      }
    }
  }
  return { ok: false, error: lastError };
}
