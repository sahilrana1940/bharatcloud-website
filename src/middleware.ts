import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isSuperAdminEmail } from "@/lib/brand";
import type { SaasRole } from "@/lib/workspace/session";

const B2C_ENABLED = process.env.ENABLE_B2C === "1";

// Lightweight - No DB - Only cookies
function readRole(req: NextRequest): SaasRole {
  const email = req.cookies.get("bc_workspace_email")?.value?.toLowerCase() || "";
  
  // Fastest check first - no function call if possible
  if (email && isSuperAdminEmail(email)) return "super_admin";

  const cached = req.cookies.get("bc_saas_role")?.value as SaasRole | undefined;
  if (cached === "super_admin") return "super_admin";

  const isOwnerCookie = req.cookies.get("bc_is_company_owner")?.value === "1";
  const wsAdmin = req.cookies.get("bc_workspace_role")?.value === "admin";
  
  if (isOwnerCookie || wsAdmin) return "company_owner";
  if (cached) return cached;
  
  return "employee";
}

// No DB - pure string check
function canAccessFast(role: SaasRole, pathname: string): boolean {
  if (role === "super_admin") return true;
  if (role === "company_owner") {
    return !pathname.startsWith("/dashboard/employee");
  }
  // employee
  return !pathname.startsWith("/admin") && !pathname.startsWith("/dashboard/owner");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🔥 FIX 1 - PUBLIC PATHS - skip everything - yehi 26s bachaega
  if (
    pathname === "/" ||
    pathname.startsWith("/pricing") ||
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/public") ||
    pathname.includes("favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const email = req.cookies.get("bc_workspace_email")?.value;
  const role = readRole(req);

  // Not logged in
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
    if (role !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // super_admin -> /admin
  if (
    (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) &&
    role === "super_admin"
  ) {
    return NextResponse.redirect(new URL("/admin", req.url));
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
    // NOTE: "/" and "/pricing" intentionally NOT in matcher = FAST
  ],
};