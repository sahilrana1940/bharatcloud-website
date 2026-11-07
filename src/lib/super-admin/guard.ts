import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isSuperAdminEmail } from "@/lib/brand";
import { WS_EMAIL_COOKIE } from "@/lib/workspace/session";

export async function superAdminEmail() {
  const jar = await cookies();
  const email = (jar.get(WS_EMAIL_COOKIE)?.value || "").trim().toLowerCase();
  if (!email || !isSuperAdminEmail(email)) return null;
  return email;
}

export async function denyUnlessSuperAdmin() {
  const email = await superAdminEmail();
  if (!email) return { email: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { email, response: null };
}
