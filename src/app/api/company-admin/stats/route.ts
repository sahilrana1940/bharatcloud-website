import { NextResponse } from "next/server";

import { loadCompanyAdminStats } from "@/lib/company-admin/stats";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isWorkspaceOwner } from "@/lib/workspace/nav";

export async function GET() {
  const auth = await requireWorkspace(true);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  if (
    !isWorkspaceOwner({
      role: session.role,
      saasRole: session.saasRole,
      isCompanyOwner: session.isCompanyOwner,
    })
  ) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      members: 0,
      storageGb: 0,
      limitGb: 100,
      activeBackups: 0,
      jobs: [],
      demo: true,
    });
  }

  const stats = await loadCompanyAdminStats(
    supabase,
    session.companyId,
    session.email,
  );

  if (!stats) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json({
    companyId: stats.companyId,
    domain: stats.domain,
    adminEmail: stats.adminEmail,
    members: stats.members,
    storageGb: stats.storageGb,
    limitGb: stats.limitGb,
    storageLabel: `${stats.storageGb.toFixed(1)} / ${stats.limitGb} GB`,
    activeBackups: stats.activeBackups,
    profilesRepaired: stats.profilesRepaired,
    jobs: stats.jobs,
  });
}
