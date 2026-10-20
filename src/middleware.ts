import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isSuperAdminEmail } from "@/lib/brand";
import { isPlatformSuperAdminEmail } from "@/lib/roles/platform-roles";
import type { SaasRole } from "@/lib/workspace/session";

const B2C_ENABLED = process.env.ENABLE_B2C === "1";

function readEmail(req: NextRequest): string {
  return req.cookies.get("bc_workspace_email")?.value?.toLowerCase() || "";
}

// Lightweight - No DB - Only cookies
function readRole(req: NextRequest): SaasRole {
  const email = readEmail(req);

  if (email && isSuperAdminEmail(email)) return "super_admin";

  const cached = req.cookies.get("bc_saas_role")?.value as SaasRole | undefined;
  if (cached === "super_admin") return "super_admin";

  const isOwnerCookie = req.cookies.get("bc_is_company_owner")?.value === "1";
  const wsAdmin = req.cookies.get("bc_workspace_role")?.value === "admin";

  if (isOwnerCookie || wsAdmin) return "company_owner";
  if (cached) return cached;

  return "employee";
}

function isGodModePath(pathname: string): boolean {
  return (
    pathname.startsWith("/godmode") ||
    pathname.startsWith("/god-mode") ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/admin/super")
  );
}

function canAccessFast(role: SaasRole, pathname: string): boolean {
  if (role === "super_admin") return true;
  if (role === "company_owner") {
    return !pathname.startsWith("/dashboard/employee");
  }
  return !pathname.startsWith("/admin") && !pathname.startsWith("/dashboard/owner");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const email = readEmail(req);

  if (
    pathname === "/" ||
    pathname.startsWith("/pricing") ||
    pathname === "/login" ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public") ||
    pathname.includes("favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const role = readRole(req);

  if (
    !email &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/personal") ||
      isGodModePath(pathname))
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isGodModePath(pathname)) {
    if (!isPlatformSuperAdminEmail(email)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (role !== "super_admin") {
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
    if (!canAccessFast(role, pathname)) {
      const dest =
        role === "super_admin"
          ? "/dashboard"
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
    "/godmode",
    "/godmode/:path*",
    "/god-mode",
    "/god-mode/:path*",
    "/super-admin",
    "/super-admin/:path*",
  ],
};
