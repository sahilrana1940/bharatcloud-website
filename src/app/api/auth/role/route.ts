import { NextResponse } from "next/server";

import { isPlatformSuperAdminEmail } from "@/lib/roles/platform-roles";
import { resolveDashboardRole } from "@/lib/workspace/dashboard-role";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { getWorkspaceSession } from "@/lib/workspace/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getWorkspaceSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isPlatformSuperAdminEmail(session.email)) {
    return NextResponse.json({ role: "admin", email: session.email, target: "/dashboard" });
  }

  const supabase = await getSupabaseOrNull();
  const resolved = await resolveDashboardRole(supabase, session.email);
  return NextResponse.json({ role: resolved.role, email: session.email, target: resolved.target });
}
