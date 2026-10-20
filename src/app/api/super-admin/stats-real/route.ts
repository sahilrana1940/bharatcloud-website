import { NextRequest, NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SUPER_ADMIN_EMAIL = "support@bharatcloud.store";

const INFRA = { vm: 800, storage: 600, bandwidth: 300, total: 1700 };

const EMPTY_MESSAGE = "No data yet - Real from Razorpay/E2E";

function isSuperAdmin(req: NextRequest) {
  const email = req.cookies.get("bc_workspace_email")?.value?.toLowerCase() || "";
  return email === SUPER_ADMIN_EMAIL;
}

export async function GET(req: NextRequest) {
  if (!isSuperAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const empty = {
    tenants: 0,
    users: 0,
    storageGb: 0,
    revenue: 0,
    backups: 0,
    pending: 0,
    infra: INFRA,
    message: EMPTY_MESSAGE,
    payments: [] as Record<string, unknown>[],
    userRows: [] as Record<string, unknown>[],
    tenantRows: [] as Record<string, unknown>[],
    logs: [] as Record<string, unknown>[],
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(empty, { headers: { "Cache-Control": "no-store" } });
  }

  const [companies, users, backups, payments, usage, failedJobs] = await Promise.all([
    supabase.from("companies").select("id, domain, plan_name, subscription_status, admin_email, created_at").order("created_at", { ascending: false }),
    supabase.from("company_users").select("id, email, role, drive_used_gb, company_id").order("email", { ascending: true }),
    supabase.from("company_backup_jobs").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("id, amount, status, created_at, company_id").order("created_at", { ascending: false }),
    supabase.from("company_users").select("drive_used_gb"),
    supabase
      .from("company_backup_jobs")
      .select("id, status, error_message, owner_email, updated_at")
      .order("updated_at", { ascending: false })
      .limit(30),
  ]);

  const tenantRows = companies.error ? [] : companies.data || [];
  const userRows = users.error ? [] : users.data || [];
  const paymentRows = payments.error ? [] : payments.data || [];
  const storageGb = (usage.error ? [] : usage.data || []).reduce(
    (sum, row) => sum + Number(row.drive_used_gb || 0),
    0,
  );
  const revenue = paymentRows
    .filter((row) => row.status === "approved")
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const pending = paymentRows.filter((row) => row.status === "pending").length;
  const backupCount = backups.error ? 0 : backups.count || 0;
  const logs = (failedJobs.error ? [] : failedJobs.data || []).filter(
    (row) => row.status === "failed" || row.error_message,
  );

  const tenants = tenantRows.length;
  const userCount = userRows.length;
  const hasBusinessData = tenants + userCount + revenue + backupCount + pending + paymentRows.length > 0;

  return NextResponse.json(
    {
      tenants,
      users: userCount,
      storageGb,
      revenue,
      backups: backupCount,
      pending,
      infra: INFRA,
      message: hasBusinessData ? null : EMPTY_MESSAGE,
      payments: paymentRows,
      userRows,
      tenantRows,
      logs,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
