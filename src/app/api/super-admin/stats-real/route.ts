import { NextRequest, NextResponse } from "next/server";

import { listCommandLogs, REAL_STATS } from "@/lib/super-admin/command-store";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 60;
export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAIL = "support@bharatcloud.store";

export async function GET(req: NextRequest) {
  const email = req.cookies.get("bc_workspace_email")?.value?.toLowerCase() || "";
  if (email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const logs = listCommandLogs();
  let storageUsed = 0;
  let storageTotal = 0;
  let tenants = REAL_STATS.tenants;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const [companies, usage] = await Promise.all([
      supabase.from("companies").select("id"),
      supabase.from("company_users").select("drive_used_gb"),
    ]);
    const rows = companies.error ? [] : companies.data || [];
    tenants = rows.length;
    storageUsed = (usage.error ? [] : usage.data || []).reduce(
      (sum, row) => sum + Number(row.drive_used_gb || 0),
      0,
    );
  }

  return NextResponse.json(
    {
      ...REAL_STATS,
      tenants,
      storageUsed,
      storageTotal,
      logsSize: "0 KB",
      logsCount: logs.length,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
