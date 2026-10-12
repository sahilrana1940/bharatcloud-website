import { NextResponse } from "next/server";

import { isPaymentBypassEnabled } from "@/lib/billing/payment-bypass";
import { companyHasPaidBackup } from "@/lib/billing/subscription";
import { readWorkspaceCookieAuth } from "@/lib/billing/workspace-cookies";
import {
  fetchGoogleTokenRow,
  isGoogleTokenRowConnected,
} from "@/lib/google/token-row";
import { processBackupJobChunk } from "@/lib/backup/process-job-chunk";
import { loadTenantCompany } from "@/lib/tenant";
import { emailMatchesDomain } from "@/lib/workspace/company-directory";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isWorkspaceOwner } from "@/lib/workspace/nav";
import { getWorkspaceSession } from "@/lib/workspace/session";

export const maxDuration = 300;

/** Owner one-click: start backup job for a discovered @domain mailbox. */
export async function POST(req: Request) {
  const session = await getWorkspaceSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    !isWorkspaceOwner({
      role: session.role,
      saasRole: session.saasRole,
      isCompanyOwner: session.isCompanyOwner,
    })
  ) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { email: targetEmail } = await req.json().catch(() => ({ email: "" }));
  const email = String(targetEmail || "").trim().toLowerCase();
  if (!email.includes("@")) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const company = await loadTenantCompany(session.companyId);
  if (!company || !emailMatchesDomain(email, company.domain)) {
    return NextResponse.json({ error: "Email must match company domain" }, { status: 400 });
  }

  const ws = await readWorkspaceCookieAuth();
  if (!ws) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const bypass = await isPaymentBypassEnabled();
  let paid = bypass;
  if (!paid) {
    paid =
      company.subscription_status === "active" ||
      (await companyHasPaidBackup(supabase, session.companyId, company.domain));
  }
  if (!paid) {
    return NextResponse.json({ error: "Active subscription required" }, { status: 402 });
  }

  const tok = await fetchGoogleTokenRow(supabase, session.companyId, email);
  if (!isGoogleTokenRowConnected(tok)) {
    return NextResponse.json(
      {
        error: `${email} must connect Google Drive in Settings first`,
        connectUrl: "/settings",
      },
      { status: 400 },
    );
  }

  await supabase.from("company_users").upsert(
    {
      company_id: session.companyId,
      email,
      role: "member",
      saas_role: "employee",
      is_company_owner: false,
      is_backup_enabled: true,
    },
    { onConflict: "company_id,email" },
  );

  const { data: running } = await supabase
    .from("company_backup_jobs")
    .select("id")
    .eq("company_id", session.companyId)
    .eq("owner_email", email)
    .in("status", ["queued", "running"])
    .limit(1)
    .maybeSingle();

  let jobId = running?.id as string | undefined;
  if (!jobId) {
    const { data: job, error } = await supabase
      .from("company_backup_jobs")
      .insert({
        company_id: session.companyId,
        owner_email: email,
        status: "queued",
      })
      .select("id")
      .single();
    if (error || !job) {
      return NextResponse.json({ error: error?.message || "Could not start job" }, { status: 500 });
    }
    jobId = job.id as string;
  }

  const first = await processBackupJobChunk(supabase, jobId);
  return NextResponse.json({ ok: true, jobId, email, ...first });
}
