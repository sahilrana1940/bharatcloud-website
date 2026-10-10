import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isSuperAdminEmail } from "@/lib/brand";
import type { SaasRole } from "@/lib/workspace/session";

function readRole(req: NextRequest): SaasRole {
  const email = req.cookies.get("bc_workspace_email")?.value?.toLowerCase();
  const cached = req.cookies.get("bc_saas_role")?.value as SaasRole | undefined;
  if (cached) return cached;
  if (isSuperAdminEmail(email)) return "super_admin";
  if (email?.startsWith("admin@")) return "company_owner";
  return "employee";
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const email = req.cookies.get("bc_workspace_email")?.value;
  const role = readRole(req);

  if (
    !email &&
    (pathname.startsWith("/dashboard") ||
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

  if (pathname.startsWith("/dashboard/owner")) {
    if (role !== "company_owner" && role !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard/employee", req.url));
    }
  }

  if (pathname.startsWith("/dashboard/team") || pathname.startsWith("/dashboard/billing")) {
    if (role === "employee") {
      return NextResponse.redirect(new URL("/dashboard/employee", req.url));
    }
  }

  if (pathname.startsWith("/dashboard/trash") && role === "employee") {
    return NextResponse.redirect(new URL("/dashboard/employee", req.url));
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
  ],
};
