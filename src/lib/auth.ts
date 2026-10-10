import { cookies } from "next/headers";

import { SUPER_ADMIN_EMAIL } from "@/lib/brand";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import {
  WS_EMAIL_COOKIE,
  WS_IS_OWNER_COOKIE,
  WS_SAAS_ROLE_COOKIE,
  workspaceCookieOptions,
  type SaasRole,
} from "@/lib/workspace/session";

export type UserRoleInfo = {
  role: SaasRole;
  is_company_owner: boolean;
  company_domain: string | null;
  email: string;
};

export function roleFromEmailDemo(email: string): UserRoleInfo {
  const e = email.toLowerCase();
  if (e === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return {
      role: "super_admin",
      is_company_owner: true,
      company_domain: null,
      email: e,
    };
  }
  if (e.startsWith("admin@")) {
    return {
      role: "company_owner",
      is_company_owner: true,
      company_domain: "rjadam.com",
      email: e,
    };
  }
  return {
    role: "employee",
    is_company_owner: false,
    company_domain: "rjadam.com",
    email: e,
  };
}

export async function getUserRole(email: string): Promise<UserRoleInfo> {
  const normalized = email.toLowerCase();
  if (
    normalized === SUPER_ADMIN_EMAIL.toLowerCase() ||
    normalized === "admin@bharatcloud.store"
  ) {
    return {
      role: "super_admin",
      is_company_owner: true,
      company_domain: null,
      email: normalized,
    };
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return roleFromEmailDemo(normalized);
  }

  const { data } = await supabase
    .from("team_members")
    .select("role, is_company_owner, company_domain, email")
    .eq("email", normalized)
    .maybeSingle();

  if (data?.role) {
    return {
      role: data.role as SaasRole,
      is_company_owner: Boolean(data.is_company_owner),
      company_domain: data.company_domain as string,
      email: normalized,
    };
  }

  const { data: cu } = await supabase
    .from("company_users")
    .select("saas_role, is_company_owner, company_id")
    .eq("email", normalized)
    .maybeSingle();

  if (cu) {
    let domain: string | null = null;
    if (cu.company_id) {
      const { data: co } = await supabase
        .from("companies")
        .select("domain")
        .eq("id", cu.company_id)
        .maybeSingle();
      domain = co?.domain ?? null;
    }
    return {
      role: (cu.saas_role as SaasRole) || "employee",
      is_company_owner: Boolean(cu.is_company_owner),
      company_domain: domain,
      email: normalized,
    };
  }

  return roleFromEmailDemo(normalized);
}

export async function getSessionRole(): Promise<UserRoleInfo | null> {
  const jar = await cookies();
  const email = jar.get(WS_EMAIL_COOKIE)?.value;
  if (!email) return null;

  const cached = jar.get(WS_SAAS_ROLE_COOKIE)?.value as SaasRole | undefined;
  const isOwner = jar.get(WS_IS_OWNER_COOKIE)?.value === "1";
  if (cached) {
    return {
      role: cached,
      is_company_owner: isOwner,
      company_domain: null,
      email: email.toLowerCase(),
    };
  }
  return getUserRole(email);
}

export function saasRoleCookiePayload(info: UserRoleInfo) {
  return {
    [WS_SAAS_ROLE_COOKIE]: info.role,
    [WS_IS_OWNER_COOKIE]: info.is_company_owner ? "1" : "0",
  };
}

export function attachSaasRoleCookies(
  res: { cookies: { set: (name: string, value: string, options: object) => void } },
  info: UserRoleInfo,
) {
  const opts = workspaceCookieOptions();
  res.cookies.set(WS_SAAS_ROLE_COOKIE, info.role, opts);
  res.cookies.set(WS_IS_OWNER_COOKIE, info.is_company_owner ? "1" : "0", opts);
}

export function canAccessPath(role: SaasRole, pathname: string): boolean {
  if (role === "super_admin") {
    return pathname.startsWith("/admin") || pathname.startsWith("/dashboard");
  }
  if (role === "company_owner") {
    if (pathname.startsWith("/admin")) return false;
    if (pathname.startsWith("/dashboard/employee")) return true;
    const ownerPaths = [
      "/dashboard/owner",
      "/dashboard/vault",
      "/dashboard/team",
      "/dashboard/billing",
      "/dashboard/drive",
      "/dashboard/shared",
      "/dashboard/recent",
    ];
    if (ownerPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return true;
    }
    return pathname.startsWith("/dashboard");
  }
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/dashboard/owner")) return false;
  if (pathname.startsWith("/dashboard/team")) return false;
  if (pathname.startsWith("/dashboard/billing")) return false;
  if (pathname.startsWith("/dashboard/trash")) return false;
  const employeePaths = [
    "/dashboard/employee",
    "/dashboard/vault",
    "/dashboard/drive",
  ];
  return employeePaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function defaultDashboardForRole(info: UserRoleInfo): string {
  if (info.role === "super_admin") return "/admin";
  if (info.role === "company_owner" || info.is_company_owner) return "/dashboard/owner";
  return "/dashboard/employee";
}
