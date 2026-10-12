import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isSuperAdminEmail } from "@/lib/brand";
import { resolveTenantCompanyId } from "@/lib/tenant";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { resolveCompanyIdForEmail } from "@/lib/workspace/resolve-company";
import {
  WS_COMPANY_COOKIE,
  WS_EMAIL_COOKIE,
  workspaceCookieOptions,
} from "@/lib/workspace/session";
import { WORKSPACE_PROFILES_TABLE } from "@/lib/workspace/workspace-profiles";

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

/** True tenant id for this email (fixes stale `bc_workspace_company` cookie). */
export async function resolveWorkspaceCompanyId(
  email: string,
  cookieCompanyId: string,
): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const fromMembership = await resolveTenantCompanyId(normalized, cookieCompanyId);
  if (fromMembership) return fromMembership;
  try {
    return await resolveCompanyIdForEmail(normalized);
  } catch {
    return cookieCompanyId;
  }
}

export function attachWorkspaceCompanyCookie(res: NextResponse, companyId: string) {
  res.cookies.set(WS_COMPANY_COOKIE, companyId, workspaceCookieOptions());
}

/** Super admin may use any company cookie; others must be member or company admin_email. */
export async function canAccessCompany(
  email: string,
  companyId: string,
): Promise<boolean> {
  if (isSuperAdminEmail(email)) return true;

  const supabase = await getSupabaseOrNull();
  if (!supabase) return true;

  const normalized = email.trim().toLowerCase();
  const effectiveId = await resolveWorkspaceCompanyId(normalized, companyId);

  const { data: member } = await supabase
    .from("company_users")
    .select("id")
    .eq("company_id", effectiveId)
    .eq("email", normalized)
    .maybeSingle();
  if (member) return true;

  const { data: co } = await supabase
    .from("companies")
    .select("admin_email")
    .eq("id", effectiveId)
    .maybeSingle();

  if (co?.admin_email?.toLowerCase() === normalized) return true;

  const { data: wp } = await supabase
    .from(WORKSPACE_PROFILES_TABLE)
    .select("company_id")
    .eq("email", normalized)
    .maybeSingle();

  return wp?.company_id === effectiveId;
}

/** Cookie auth with repaired `companyId` when membership does not match stale cookie. */
export async function readWorkspaceAuthRepaired(): Promise<{
  auth: WorkspaceCookieAuth;
  repaired: boolean;
} | null> {
  const ws = await readWorkspaceCookieAuth();
  if (!ws) return null;

  const effectiveId = await resolveWorkspaceCompanyId(ws.email, ws.companyId);
  const repaired = effectiveId !== ws.companyId;
  return {
    auth: { email: ws.email, companyId: effectiveId },
    repaired,
  };
}
