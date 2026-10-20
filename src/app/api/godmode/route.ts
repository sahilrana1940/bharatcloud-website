import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAIL = "support@bharatcloud.store";

function denied(req: NextRequest) {
  const email = req.cookies.get("bc_workspace_email")?.value?.toLowerCase() || "";
  return email !== SUPER_ADMIN_EMAIL;
}

export async function GET(req: NextRequest) {
  if (denied(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      {
        totalWorkspaces: 0,
        storageUsed: 0,
        gmailPending: 0,
        drivePending: 0,
        backupCount: 0,
        infraCost: 1700,
        message: "No data yet - Real from Razorpay/E2E",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const [companies, usage, backups] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("company_users").select("drive_used_gb"),
    supabase.from("company_backup_jobs").select("id", { count: "exact", head: true }),
  ]);

  const storageUsed = (usage.error ? [] : usage.data || []).reduce(
    (sum, row) => sum + Number(row.drive_used_gb || 0),
    0,
  );

  return NextResponse.json(
    {
      totalWorkspaces: companies.error ? 0 : companies.count || 0,
      storageUsed,
      gmailPending: 0,
      drivePending: 0,
      backupCount: backups.error ? 0 : backups.count || 0,
      infraCost: 1700,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
