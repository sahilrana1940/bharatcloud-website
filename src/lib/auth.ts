import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { isSuperAdminEmail } from "@/lib/brand";
import {
  WS_IS_OWNER_COOKIE,
  WS_SAAS_ROLE_COOKIE,
  workspaceCookieOptions,
  type SaasRole,
} from "@/lib/workspace/session";

// --- NO DB, NO SUPABASE, NO BILLING IMPORT - FAST ---

export type UserRoleInfo = {
  role: SaasRole;
  is_company_owner: boolean;
  company_domain: string | null;
  email: string | null;
};

export function canAccessPath(role: SaasRole, pathname: string): boolean {
  if (role === "super_admin") return true;
  if (pathname.startsWith("/admin")) return false;
  
  if (role === "company_owner") {
    // company_owner cannot access employee dashboard
    if (pathname.startsWith("/dashboard/employee")) return false;
    return true;
  }
  
  // employee
  if (pathname.startsWith("/dashboard/owner")) return false;
  return true;
}

export async function getCurrentUser(): Promise<UserRoleInfo> {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get("bc_workspace_email")?.value || null;
    const roleCookie = cookieStore.get("bc_saas_role")?.value as SaasRole | undefined;
    const isOwner = cookieStore.get("bc_is_company_owner")?.value === "1";
    const wsAdmin = cookieStore.get("bc_workspace_role")?.value === "admin";

    if (!email) {
      return { role: "employee", is_company_owner: false, company_domain: null, email: null };
    }

    if (isSuperAdminEmail(email)) {
      return { role: "super_admin", is_company_owner: true, company_domain: email.split("@")[1] || null, email };
    }

    let role: SaasRole = roleCookie || "employee";
    if (isOwner || wsAdmin) role = "company_owner";

    return {
      role,
      is_company_owner: isOwner || wsAdmin || role === "company_owner",
      company_domain: email.split("@")[1] || null,
      email,
    };
  } catch {
    return { role: "employee", is_company_owner: false, company_domain: null, email: null };
  }
}

export async function getSessionRole(): Promise<UserRoleInfo> {
  return getCurrentUser();
}

export async function getUserRole(email?: string | null): Promise<UserRoleInfo> {
  const current = await getCurrentUser();
  const requested = email?.toLowerCase();
  if (requested && current.email?.toLowerCase() !== requested && isSuperAdminEmail(requested)) {
    return {
      role: "super_admin",
      is_company_owner: true,
      company_domain: requested.split("@")[1] || null,
      email: requested,
    };
  }
  return current;
}

export function defaultDashboardForRole(info: UserRoleInfo): string {
  if (info.role === "super_admin") return "/dashboard";
  if (info.role === "company_owner" || info.is_company_owner) return "/dashboard/admin";
  return "/dashboard/employee";
}

export function attachSaasRoleCookies(res: NextResponse, info: UserRoleInfo) {
  const opts = workspaceCookieOptions();
  res.cookies.set(WS_SAAS_ROLE_COOKIE, info.role, opts);
  res.cookies.set(WS_IS_OWNER_COOKIE, info.is_company_owner ? "1" : "0", opts);
}

// For middleware public check
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/pricing") ||
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.includes("favicon")
  );
}