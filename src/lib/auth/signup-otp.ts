import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";

export const SIGNUP_OTP_COOKIE = "bc_signup_otp";
const TEN_MINUTES = 10 * 60;

export type SignupOtpPayload = {
  email: string;
  phone: string;
  company: string;
  password: string;
  otp: string;
  exp: number;
};

function otpSecret() {
  return process.env.OTP_SECRET || process.env.CRON_SECRET || "bharatcloud-signup-otp-test";
}

export function sixDigitOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function signSignupOtp(payload: SignupOtpPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", otpSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSignupOtp(token: string | undefined): SignupOtpPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", otpSecret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SignupOtpPayload;
    if (!payload.email || !payload.otp || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function allowedOrigin(origin: string) {
  try {
    const host = new URL(origin).hostname;
    return (
      host === "bharatcloud.store" ||
      host.endsWith(".bharatcloud.store") ||
      host === "bharattijori.com" ||
      host.endsWith(".bharattijori.com") ||
      host === "localhost" ||
      host === "127.0.0.1"
    );
  } catch {
    return false;
  }
}

export function withSignupCors(res: NextResponse, req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && allowedOrigin(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin");
  }
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export function signupPreflight(req: NextRequest) {
  return withSignupCors(new NextResponse(null, { status: 204 }), req);
}

export function signupJson(req: NextRequest, body: unknown, status = 200) {
  const res = NextResponse.json(body, { status });
  return withSignupCors(res, req);
}

export function attachSignupCookie(res: NextResponse, payload: SignupOtpPayload) {
  res.cookies.set(SIGNUP_OTP_COOKIE, signSignupOtp(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TEN_MINUTES,
  });
  return res;
}

/** Email is optional. A missing Resend key must not block signup. */
export async function trySendOtpEmail(email: string, otp: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.log(`[signup-otp] test mode (no RESEND_API_KEY) email=${email} otp=${otp}`);
    return false;
  }

  const from = process.env.RESEND_FROM_EMAIL?.trim() || "BharatCloud <onboarding@resend.dev>";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Your BharatCloud signup code",
        text: `Your BharatCloud code is ${otp}. It expires in 10 minutes.`,
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.log(`[signup-otp] email failed, test code still valid email=${email} otp=${otp} detail=${detail.slice(0, 180)}`);
      return false;
    }
    console.log(`[signup-otp] emailed email=${email} otp=${otp}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "email failed";
    console.log(`[signup-otp] email skipped email=${email} otp=${otp} reason=${message}`);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function handleSendOtp(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email) return signupJson(req, { error: "Email required" }, 400);
    if (!password) return signupJson(req, { error: "Password required" }, 400);

    const otp = sixDigitOtp();
    const emailed = await trySendOtpEmail(email, otp);
    console.log(`[signup-otp] email=${email} otp=${otp} emailed=${emailed}`);

    const res = signupJson(req, { success: true, otp, testMode: !emailed, emailed });
    return attachSignupCookie(res, {
      email,
      phone,
      company,
      password,
      otp,
      exp: Date.now() + 10 * 60 * 1000,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send OTP";
    console.error("[signup-otp]", message);
    return signupJson(req, { error: message }, 500);
  }
}

export async function handleVerifyOtp(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = body.otp === undefined || body.otp === null ? "" : String(body.otp).trim();

    if (!email || !otp) {
      return signupJson(req, { error: "OTP required - Please enter OTP" }, 400);
    }

    const pending = readSignupOtp(req.cookies.get(SIGNUP_OTP_COOKIE)?.value);
    if (!pending || pending.email !== email || pending.otp !== otp) {
      return signupJson(req, { error: "Wrong OTP" }, 400);
    }

    const admin = getSupabaseAdmin();
    if (admin) {
      const created = await admin.auth.admin.createUser({
        email,
        password: pending.password,
        email_confirm: true,
        user_metadata: { company: pending.company, phone: pending.phone, full_name: pending.company },
      });
      if (created.error && !/already registered|already been registered/i.test(created.error.message)) {
        console.error("[verify-otp] supabase", created.error.message);
        return signupJson(req, { error: created.error.message }, 500);
      }
    } else {
      console.log(`[verify-otp] OTP matched for ${email}. Supabase service role is not set, so login is not created yet.`);
    }

    const res = signupJson(req, { success: true, company: pending.company || "My Company" });
    res.cookies.set(SIGNUP_OTP_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not verify OTP";
    console.error("[verify-otp]", message);
    return signupJson(req, { error: message }, 500);
  }
}
