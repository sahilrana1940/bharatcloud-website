import { cookies } from "next/headers";

import { SUPER_ADMIN_EMAIL } from "@/lib/b2b/constants";

export const B2B_SESSION_COOKIE = "bharatcloud_b2b_admin";
export const B2B_EMAIL_COOKIE = "bharatcloud_b2b_email";
export const SUPER_ADMIN_COOKIE = "bharatcloud_super_admin";

export async function getB2BCompanyId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(B2B_SESSION_COOKIE)?.value ?? null;
}

export async function getB2BAdminEmail(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(B2B_EMAIL_COOKIE)?.value ?? null;
}

export async function isSuperAdminSession(): Promise<boolean> {
  const jar = await cookies();
  const flag = jar.get(SUPER_ADMIN_COOKIE)?.value;
  const email = jar.get(B2B_EMAIL_COOKIE)?.value;
  return flag === "1" && email === SUPER_ADMIN_EMAIL;
}

