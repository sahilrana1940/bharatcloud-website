import { NextResponse } from "next/server";

import { SUPER_ADMIN_EMAIL } from "@/lib/b2b/constants";
import { isPaymentBypassEnabled } from "@/lib/billing/payment-bypass";
import { getSessionRole } from "@/lib/auth";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const role = await getSessionRole();
  if (!role || (role.role !== "super_admin" && role.email !== SUPER_ADMIN_EMAIL)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await getSupabaseOrNull();
  const paymentBypass = isPaymentBypassEnabled();

  if (!supabase) {
    return NextResponse.json({
      paymentBypass,
      stats: {
        companies: 1,
        mrrInr: 1999,
        backups: 0,
        users: 5,
      },
      companies: [
        { name: "demo.example.com", plan: "Free", status: "trial" },
      ],
      logs: [
        { code: 200, message: "Demo mode — connect Supabase for live logs" },
      ],
    });
  }

  const { count: companiesCount } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true });

  const { data: paidPayments } = await supabase
    .from("payments")
    .select("amount")
    .in("status", ["approved", "paid", "active"]);

  const mrrInr = (paidPayments || []).reduce((s, p) => s + Number(p.amount || 0), 0);

  const { count: backupsCount } = await supabase
    .from("company_backup_jobs")
    .select("*", { count: "exact", head: true });

  const { count: usersCount } = await supabase
    .from("company_users")
    .select("*", { count: "exact", head: true });

  const { data: recentCompanies } = await supabase
    .from("companies")
    .select("domain, plan_name, subscription_status")
    .order("created_at", { ascending: false })
    .limit(5);

  const companies = (recentCompanies || []).map((c) => ({
    name: c.domain as string,
    plan:
      c.subscription_status === "active" || c.plan_name !== "starter"
        ? "Paid"
        : "Free",
    status:
      c.subscription_status === "active"
        ? "Active"
        : c.subscription_status === "blocked"
          ? "Suspended"
          : "Trial",
  }));

  const { data: recentJobs } = await supabase
    .from("company_backup_jobs")
    .select("status, error_message, owner_email, updated_at")
    .order("updated_at", { ascending: false })
    .limit(8);

  const logs: { code: number; message: string }[] = [];
  for (const j of recentJobs || []) {
    if (j.status === "failed" || j.error_message) {
      logs.push({
        code: 402,
        message: `Backup blocked/failed for ${j.owner_email}: ${j.error_message || "subscription"}`,
      });
    } else if (j.status === "completed") {
      logs.push({
        code: 200,
        message: `Backup completed for ${j.owner_email}`,
      });
    } else if (j.status === "running") {
      logs.push({
        code: 200,
        message: `Backup running for ${j.owner_email}`,
      });
    }
  }

  if (!logs.length) {
    logs.push({
      code: 401,
      message: "No backup jobs yet — expect 401 without workspace cookies on API",
    });
  }

  const { data: lastBackup } = await supabase
    .from("company_backup_jobs")
    .select("updated_at")
    .eq("status", "completed")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    paymentBypass,
    stats: {
      companies: companiesCount || 0,
      mrrInr,
      backups: backupsCount || 0,
      users: usersCount || 0,
      lastBackupAt: lastBackup?.updated_at || null,
    },
    companies,
    logs: logs.slice(0, 6),
  });
}
