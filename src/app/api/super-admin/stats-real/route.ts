import { NextRequest, NextResponse } from "next/server";

import { infraFromUsage } from "@/lib/admin/platform-costs";
import { measureE2EStorage } from "@/lib/e2e/measure-storage";
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
  let tenants = REAL_STATS.tenants;
  let quotaGb = 0;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const companies = await supabase.from("companies").select("id, storage_limit_gb");
    const rows = companies.error ? [] : companies.data || [];
    tenants = rows.length;
    quotaGb = rows.reduce((sum, row) => sum + Number(row.storage_limit_gb || 0), 0);
  }

  const measured = await measureE2EStorage();
  const infra = infraFromUsage(measured.usedGb);

  return NextResponse.json(
    {
      ...REAL_STATS,
      tenants,
      storageUsed: measured.usedGb,
      storageBytes: measured.usedBytes,
      storageTotal: quotaGb || measured.usedGb,
      objectCount: measured.objectCount,
      bucket: measured.bucket,
      endpoint: measured.endpoint,
      region: measured.region,
      storageError: measured.ok ? null : measured.error || "Storage measurement failed",
      storageWarning: measured.warning || null,
      infra,
      logsSize: "0 KB",
      logsCount: logs.length,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
