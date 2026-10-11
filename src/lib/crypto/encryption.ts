import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function encryptionKey(): Buffer | null {
  const secret = process.env.ENCRYPTION_KEY?.trim();
  if (!secret) return null;
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptSecret(plain: string | null | undefined): string | null {
  if (!plain) return null;
  const key = encryptionKey();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY is required to store OAuth tokens in production");
    }
    return plain;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, ciphertext]).toString("base64url");
  return `${PREFIX}${payload}`;
}

export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(PREFIX)) return stored;
  const key = encryptionKey();
  if (!key) return stored;
  const raw = Buffer.from(stored.slice(PREFIX.length), "base64url");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function hasEncryptedOrPlainToken(value: string | null | undefined): boolean {
  return Boolean(value && value.length > 0);
}
