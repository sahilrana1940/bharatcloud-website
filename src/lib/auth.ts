import { cookies } from "next/headers";

import { isSuperAdminEmail } from "@/lib/brand";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isTenantOwnerEmail, ownerRoleInfo } from "@/lib/workspace/owner-role";
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
  if (isSuperAdminEmail(e)) {
    return {
      role: "super_admin",
      is_company_owner: false,
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
  if (isSuperAdminEmail(normalized)) {
    return {
      role: "super_admin",
      is_company_owner: false,
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
    const domain = (data.company_domain as string) || null;
    if (await isTenantOwnerEmail(supabase, normalized)) {
      return ownerRoleInfo(normalized, domain);
    }
    return {
      role: data.role as SaasRole,
      is_company_owner: Boolean(data.is_company_owner),
      company_domain: domain,
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
        .select("domain, admin_email")
        .eq("id", cu.company_id)
        .maybeSingle();
      domain = co?.domain ?? null;
      if (co?.admin_email?.toLowerCase() === normalized) {
        return ownerRoleInfo(normalized, domain);
      }
    }
    if (await isTenantOwnerEmail(supabase, normalized, cu.company_id as string)) {
      return ownerRoleInfo(normalized, domain);
    }
    return {
      role: (cu.saas_role as SaasRole) || "employee",
      is_company_owner: Boolean(cu.is_company_owner),
      company_domain: domain,
      email: normalized,
    };
  }

  if (await isTenantOwnerEmail(supabase, normalized)) {
    const { data: co } = await supabase
      .from("companies")
      .select("domain")
      .eq("admin_email", normalized)
      .maybeSingle();
    return ownerRoleInfo(normalized, (co?.domain as string) ?? null);
  }

  return roleFromEmailDemo(normalized);
}

export async function getSessionRole(): Promise<UserRoleInfo | null> {
  const jar = await cookies();
  const email = jar.get(WS_EMAIL_COOKIE)?.value;
  if (!email) return null;

  const normalized = email.toLowerCase();
  if (isSuperAdminEmail(normalized)) {
    return getUserRole(normalized);
  }

  const cached = jar.get(WS_SAAS_ROLE_COOKIE)?.value as SaasRole | undefined;
  const isOwner = jar.get(WS_IS_OWNER_COOKIE)?.value === "1";
  if (cached) {
    return {
      role: cached,
      is_company_owner: isOwner,
      company_domain: null,
      email: normalized,
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
      "/dashboard/company-admin",
      "/dashboard/vault",
      "/dashboard/team",
      "/dashboard/billing",
      "/dashboard/drive",
      "/dashboard/shared",
      "/dashboard/recent",
      "/dashboard/emails",
    ];
    if (ownerPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return true;
    }
    return pathname.startsWith("/dashboard");
  }
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/settings")) return true;
  const blocked = [
    "/dashboard/owner",
    "/dashboard/company-admin",
    "/dashboard/billing",
    "/dashboard/trash",
    "/dashboard/team",
    "/dashboard/shared",
    "/dashboard/recent",
    "/dashboard/vault",
    "/dashboard/my-vault",
    "/dashboard/emails",
  ];
  if (blocked.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  const employeePaths = ["/dashboard/employee", "/dashboard/drive"];
  if (pathname.startsWith("/dashboard/employee/mail")) return true;
  return employeePaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function defaultDashboardForRole(info: UserRoleInfo): string {
  if (info.role === "super_admin") return "/admin";
  if (info.role === "company_owner" || info.is_company_owner) return "/dashboard/owner";
  return "/dashboard/employee";
}
