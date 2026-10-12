import { NextResponse } from "next/server";

import { readPaymentBypassFlag } from "@/lib/billing/payment-bypass";
import { isSuperAdminEmail } from "@/lib/brand";
import { getSessionRole } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const role = await getSessionRole();
  if (!role?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdminEmail(role.email) && role.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { count: companies } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true });

  const { count: users } = await supabase
    .from("company_users")
    .select("*", { count: "exact", head: true });

  const { count: backups } = await supabase
    .from("company_backup_jobs")
    .select("*", { count: "exact", head: true });

  const { data: paymentRows } = await supabase
    .from("payments")
    .select("amount")
    .eq("status", "approved");

  const billing = (paymentRows || []).reduce((s, p) => s + Number(p.amount || 0), 0);

  const { data: recentCompanies } = await supabase
    .from("companies")
    .select("domain, plan_name, subscription_status")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: recentJobs } = await supabase
    .from("company_backup_jobs")
    .select("status, error_message, owner_email, updated_at")
    .order("updated_at", { ascending: false })
    .limit(12);

  const logs: { code: number; message: string }[] = [];
  for (const j of recentJobs || []) {
    if (j.status === "failed" || j.error_message) {
      logs.push({
        code: 402,
        message: `Payment/backup failed for ${j.owner_email}: ${j.error_message || "subscription required"}`,
      });
    } else if (j.status === "completed" || j.status === "running") {
      logs.push({
        code: 200,
        message: `Backup ${j.status} for ${j.owner_email}`,
      });
    } else {
      logs.push({
        code: 401,
        message: `Queued job for ${j.owner_email} — API needs workspace cookies`,
      });
    }
  }

  const bypass = await readPaymentBypassFlag();

  if (!logs.length) {
    const companyCount = companies || 0;
    logs.push({
      code: 200,
      message: `Platform OK — ${companyCount} companies · bypass=${bypass}`,
    });
    if (companyCount > 0 && billing === 0) {
      logs.push({
        code: 402,
        message: "No approved payments yet — expect 402 on /api/backup/start-auto when bypass is off",
      });
    }
    logs.push({
      code: 401,
      message: "Missing bc_workspace cookies → /api/billing/status returns 401",
    });
  }

  return NextResponse.json({
    data: {
      companies: companies || 0,
      users: users || 0,
      backups: backups || 0,
      billing,
    },
    bypass,
    recentCompanies: (recentCompanies || []).map((c) => {
      const sub = (c.subscription_status as string) || "trial";
      const planName = ((c.plan_name as string) || "starter").replace(/_/g, " ");
      return {
        name: c.domain as string,
        plan: planName.charAt(0).toUpperCase() + planName.slice(1),
        status:
          sub === "blocked"
            ? "Suspended"
            : sub === "active"
              ? "Active"
              : "Trial",
      };
    }),
    logs,
  });
}
