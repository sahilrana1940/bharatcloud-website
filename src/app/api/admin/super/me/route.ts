import { NextResponse } from "next/server";

import { SUPER_ADMIN_PLATFORM_EMAILS } from "@/lib/admin/platform-costs";
import { isSuperAdminEmail } from "@/lib/brand";
import { getSessionRole } from "@/lib/auth";

export async function GET() {
  const role = await getSessionRole();
  if (!role?.email || (!isSuperAdminEmail(role.email) && role.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    email: role.email,
    configuredSuperAdmins: [...SUPER_ADMIN_PLATFORM_EMAILS],
    primarySuperAdmin: SUPER_ADMIN_PLATFORM_EMAILS[0],
  });
}
