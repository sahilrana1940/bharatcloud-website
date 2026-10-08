import { NextResponse } from "next/server";

import { SUPER_ADMIN_EMAIL } from "@/lib/b2b/constants";
import {
  B2B_EMAIL_COOKIE,
  SUPER_ADMIN_COOKIE,
} from "@/lib/b2b/session";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const normalized = String(email || "").trim().toLowerCase();
  const pass = String(password || "");

  if (normalized !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (pass.length < 6) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(B2B_EMAIL_COOKIE, normalized, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.set(SUPER_ADMIN_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
