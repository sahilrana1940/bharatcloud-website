import { NextResponse } from "next/server";

import { isDemoBillingDomain } from "@/lib/billing/demo-domain";
import { isPaymentBypassEnabled } from "@/lib/billing/payment-bypass";
import { companyHasPaidBackup } from "@/lib/billing/subscription";
import {
  attachWorkspaceCompanyCookie,
  backupUnauthorized,
  canAccessCompany,
  readWorkspaceAuthRepaired,
} from "@/lib/billing/workspace-cookies";
import {
  fetchGoogleTokenRowForWorkspace,
  isGoogleTokenRowConnected,
} from "@/lib/google/token-row";
import { processBackupJobChunk } from "@/lib/backup/process-job-chunk";
import { loadTenantCompany } from "@/lib/tenant";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export const maxDuration = 300;

export async function POST() {
  const repairedAuth = await readWorkspaceAuthRepaired();
  if (!repairedAuth) {
    return backupUnauthorized();
  }
  const { auth: ws, repaired } = repairedAuth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const allowed = await canAccessCompany(ws.email, ws.companyId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const company = await loadTenantCompany(ws.companyId);
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const bypass = await isPaymentBypassEnabled();
  let paid = bypass;

  if (!paid) {
    if (company.subscription_status === "active") {
      paid = true;
    } else if (isDemoBillingDomain(company.domain)) {
      paid = true;
    } else {
      paid = await companyHasPaidBackup(supabase, ws.companyId, company.domain);
    }
  }

  if (!paid) {
    return NextResponse.json(
      { error: "Active subscription required. Complete payment on Billing first." },
      { status: 402 },
    );
  }

  const tok = await fetchGoogleTokenRowForWorkspace(supabase, ws.companyId, ws.email);

  if (!isGoogleTokenRowConnected(tok)) {
    return NextResponse.json(
      { error: "Connect Google Drive first", connectUrl: "/settings" },
      { status: 400 },
    );
  }

  const { data: running } = await supabase
    .from("company_backup_jobs")
    .select("id, status")
    .eq("company_id", ws.companyId)
    .eq("owner_email", ws.email)
    .in("status", ["queued", "running"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let jobId = running?.id as string | undefined;

  if (!jobId) {
    const { data: job, error } = await supabase
      .from("company_backup_jobs")
      .insert({
        company_id: ws.companyId,
        owner_email: ws.email,
        status: "queued",
      })
      .select("id")
      .single();
    if (error || !job) {
      return NextResponse.json({ error: error?.message || "Could not start job" }, { status: 500 });
    }
    jobId = job.id as string;
  }

  const first = await processBackupJobChunk(supabase, jobId as string);

  const res = NextResponse.json({
    ok: true,
    jobId,
    done: first.done,
    filesDone: first.filesDone,
    error: first.error,
    cookieRepaired: repaired,
  });
  if (repaired) attachWorkspaceCompanyCookie(res, ws.companyId);
  return res;
}
