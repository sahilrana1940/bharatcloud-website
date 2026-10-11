import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isSuperAdminEmail } from "@/lib/brand";
import { WS_COMPANY_COOKIE, WS_EMAIL_COOKIE } from "@/lib/workspace/session";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export type WorkspaceCookieAuth = {
  companyId: string;
  email: string;
};

/** `bc_workspace_company` = `companies.id`, `bc_workspace_email` = workspace user. */
export async function readWorkspaceCookieAuth(): Promise<WorkspaceCookieAuth | null> {
  const jar = await cookies();
  const companyId = jar.get(WS_COMPANY_COOKIE)?.value?.trim();
  const email = jar.get(WS_EMAIL_COOKIE)?.value?.trim().toLowerCase();
  if (!companyId || !email) return null;
  return { companyId, email };
}

export function billingStatusUnauthorized(): NextResponse {
  return NextResponse.json({ active: false, error: "Unauthorized" }, { status: 401 });
}

export function backupUnauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** Super admin may use any company cookie; others must be member or company admin_email. */
export async function canAccessCompany(
  email: string,
  companyId: string,
): Promise<boolean> {
  if (isSuperAdminEmail(email)) return true;

  const supabase = await getSupabaseOrNull();
  if (!supabase) return true;

  const { data: member } = await supabase
    .from("company_users")
    .select("id")
    .eq("company_id", companyId)
    .eq("email", email)
    .maybeSingle();
  if (member) return true;

  const { data: co } = await supabase
    .from("companies")
    .select("admin_email")
    .eq("id", companyId)
    .maybeSingle();

  return co?.admin_email?.toLowerCase() === email;
}
