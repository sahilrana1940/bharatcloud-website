import { cookies } from "next/headers";

export const B2B_SESSION_COOKIE = "bharatcloud_b2b_admin";

export async function getB2BCompanyId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(B2B_SESSION_COOKIE)?.value ?? null;
}
