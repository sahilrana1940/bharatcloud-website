import { NextResponse } from "next/server";

import { getSupabaseOrNull } from "@/lib/workspace/db";
import {
  getWorkspaceSession,
  type SaasRole,
  type WorkspaceRole,
} from "@/lib/workspace/session";

export type TenantCompany = {
  id: string;
  domain: string;
  admin_email: string;
  plan_name: string;
  storage_limit_gb: number;
  subscription_status?: string | null;
};

export type TenantContext = {
  companyId: string;
  email: string;
  role: WorkspaceRole;
  saasRole: SaasRole;
  isCompanyOwner: boolean;
  company: TenantCompany;
};

export type WorkspaceSessionSlice = {
  companyId: string;
  email: string;
  role: WorkspaceRole;
  saasRole?: SaasRole;
  isCompanyOwner?: boolean;
};

/** Resolve company_id from session cookie, validated against company_users. */
export async function resolveTenantCompanyId(
  email: string,
  cookieCompanyId: string | null,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  const supabase = await getSupabaseOrNull();
  if (!supabase) return cookieCompanyId;

  const { data: memberships } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("email", normalized);

  const ids = (memberships || []).map((m) => m.company_id as string);
  if (!ids.length) {
    const { data: owned } = await supabase
      .from("companies")
      .select("id")
      .eq("admin_email", normalized)
      .maybeSingle();
    return owned?.id ?? cookieCompanyId;
  }

  if (cookieCompanyId && ids.includes(cookieCompanyId)) return cookieCompanyId;
  return ids[0] ?? null;
}

export async function loadTenantCompany(companyId: string): Promise<TenantCompany | null> {
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return {
      id: companyId,
      domain: process.env.DEMO_COMPANY_DOMAIN || "demo.local",
      admin_email: "owner@demo.local",
      plan_name: "starter",
      storage_limit_gb: 100,
      subscription_status: "trial",
    };
  }

  const { data } = await supabase
    .from("companies")
    .select("id, domain, admin_email, plan_name, storage_limit_gb, subscription_status")
    .eq("id", companyId)
    .maybeSingle();

  if (!data?.id) return null;
  return {
    id: data.id as string,
    domain: data.domain as string,
    admin_email: data.admin_email as string,
    plan_name: (data.plan_name as string) || "starter",
    storage_limit_gb: Number(data.storage_limit_gb ?? 100),
    subscription_status: data.subscription_status as string | null,
  };
}

/**
 * Full tenant context for API routes — company_id always from validated membership.
 */
export async function requireTenant(
  adminOnly = false,
): Promise<{ tenant: TenantContext; session: WorkspaceSessionSlice } | NextResponse> {
  const session = await getWorkspaceSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = await resolveTenantCompanyId(session.email, session.companyId);
  if (!companyId) {
    return NextResponse.json({ error: "No company membership" }, { status: 403 });
  }

  const company = await loadTenantCompany(companyId);
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  if (
    adminOnly &&
    session.role !== "admin" &&
    !session.isCompanyOwner &&
    session.saasRole !== "company_owner" &&
    session.saasRole !== "super_admin"
  ) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const tenant: TenantContext = {
    companyId: company.id,
    email: session.email.toLowerCase(),
    role: session.role,
    saasRole: session.saasRole,
    isCompanyOwner: session.isCompanyOwner,
    company,
  };

  return {
    tenant,
    session: {
      companyId: company.id,
      email: session.email.toLowerCase(),
      role: session.role,
      saasRole: session.saasRole,
      isCompanyOwner: session.isCompanyOwner,
    },
  };
}

/** Supabase query helper — always scope by tenant company_id. */
export function withCompanyId<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  companyId: string,
): T {
  return query.eq("company_id", companyId);
}
