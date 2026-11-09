import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const PRODUCT_COOKIE = "bc_hub";
const FOURTEEN_DAYS = 60 * 60 * 24 * 14;

function secret() {
  return process.env.OTP_SECRET || process.env.CRON_SECRET || process.env.ENCRYPTION_KEY || "bharatcloud-hub";
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function makeSessionToken(userId: string) {
  const exp = Date.now() + FOURTEEN_DAYS * 1000;
  const body = `${userId}.${exp}`;
  return `${body}.${sign(body)}`;
}

export function readSessionToken(raw: string | undefined | null) {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const expected = sign(`${id}.${exp}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now()) return null;
  return id;
}

export async function sessionUserId() {
  const jar = await cookies();
  return readSessionToken(jar.get(PRODUCT_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: FOURTEEN_DAYS,
    secure: process.env.NODE_ENV === "production",
  };
}
