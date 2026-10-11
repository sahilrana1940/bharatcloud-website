import { NextResponse } from "next/server";

import { companyHasPaidBackup } from "@/lib/billing/subscription";
import {
  fetchGoogleTokenRow,
  isGoogleTokenRowConnected,
} from "@/lib/google/token-row";
import { processBackupJobChunk } from "@/lib/backup/process-job-chunk";
import { resolveCompanyDomain } from "@/lib/workspace/company";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export const maxDuration = 300;

export async function POST() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const domain = await resolveCompanyDomain(session.companyId, session.email);
  const paid = await companyHasPaidBackup(supabase, session.companyId, domain);
  if (!paid) {
    return NextResponse.json(
      { error: "Active subscription required. Complete payment on Billing first." },
      { status: 402 },
    );
  }

  const tok = await fetchGoogleTokenRow(supabase, session.companyId, session.email);

  if (!isGoogleTokenRowConnected(tok)) {
    return NextResponse.json(
      { error: "Connect Google Drive first", connectUrl: "/settings" },
      { status: 400 },
    );
  }

  const { data: running } = await supabase
    .from("company_backup_jobs")
    .select("id, status")
    .eq("company_id", session.companyId)
    .eq("owner_email", session.email.toLowerCase())
    .in("status", ["queued", "running"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let jobId = running?.id as string | undefined;

  if (!jobId) {
    const { data: job, error } = await supabase
      .from("company_backup_jobs")
      .insert({
        company_id: session.companyId,
        owner_email: session.email.toLowerCase(),
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

  return NextResponse.json({
    ok: true,
    jobId,
    done: first.done,
    filesDone: first.filesDone,
    error: first.error,
  });
}
