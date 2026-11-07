import { NextRequest, NextResponse } from "next/server";

import { SUPER_ADMIN_OWNER as SUPER_ADMIN_EMAIL } from "@/lib/constants";
import { listCommandLogs, REAL_STATS } from "@/lib/super-admin/command-store";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.cookies.get("bc_workspace_email")?.value?.toLowerCase() || "";
  if (email !== SUPER_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const logs = listCommandLogs();
  let tenants = REAL_STATS.tenants;
  let quotaGb = 0;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const companies = await supabase.from("companies").select("id, storage_limit_gb");
    const rows = companies.error ? [] : companies.data || [];
    tenants = rows.length;
    quotaGb = rows.reduce((sum, row) => sum + Number(row.storage_limit_gb || 0), 0);
  }

  return NextResponse.json(
    {
      ...REAL_STATS,
      tenants,
      storageUsed: 0,
      storageBytes: 0,
      storageTotal: quotaGb,
      objectCount: 0,
      bucket: null,
      endpoint: null,
      region: null,
      storageError: null,
      storageWarning: null,
      infra: { monthlyUsd: 0 },
      logsSize: "0 KB",
      logsCount: logs.length,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
