import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { canAccessPath } from "@/lib/auth";
import { isSuperAdminEmail } from "@/lib/brand";

const B2C_ENABLED = process.env.ENABLE_B2C === "1";
import type { SaasRole } from "@/lib/workspace/session";

function readRole(req: NextRequest): SaasRole {
  const email = req.cookies.get("bc_workspace_email")?.value?.toLowerCase();
  if (isSuperAdminEmail(email)) return "super_admin";

  const cached = req.cookies.get("bc_saas_role")?.value as SaasRole | undefined;
  if (cached === "super_admin") return "super_admin";

  const isOwnerCookie = req.cookies.get("bc_is_company_owner")?.value === "1";
  const wsAdmin = req.cookies.get("bc_workspace_role")?.value === "admin";
  if (isOwnerCookie || wsAdmin) return "company_owner";

  if (cached === "company_owner") return cached;
  if (isSuperAdminEmail(email)) return "super_admin";
  if (email?.startsWith("admin@")) return "company_owner";
  if (cached) return cached;
  return "employee";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const email = req.cookies.get("bc_workspace_email")?.value;
  const role = readRole(req);

  if (
    !email &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/personal"))
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!isSuperAdminEmail(email) && role !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (
    role === "company_owner" &&
    (pathname === "/dashboard/employee" || pathname.startsWith("/dashboard/employee/"))
  ) {
    return NextResponse.redirect(new URL("/dashboard/owner", req.url));
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/settings")) {
    if (!canAccessPath(role, pathname)) {
      const dest =
        role === "super_admin"
          ? "/admin"
          : role === "company_owner"
            ? "/dashboard/owner"
            : "/dashboard/employee";
      return NextResponse.redirect(new URL(dest, req.url));
    }
  }

  if (!B2C_ENABLED && pathname.startsWith("/personal")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/personal",
    "/personal/:path*",
    "/settings",
    "/settings/:path*",
  ],
};
