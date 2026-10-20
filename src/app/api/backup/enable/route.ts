import { NextResponse } from "next/server";

import { isPaymentBypassEnabled } from "@/lib/billing/payment-bypass";
import { companyHasPaidBackup } from "@/lib/billing/subscription";
import { readWorkspaceCookieAuth } from "@/lib/billing/workspace-cookies";
import {
  fetchGoogleTokenRow,
  isGoogleTokenRowConnected,
} from "@/lib/google/token-row";
import { runEmailArchiveForUser } from "@/lib/archive/run-email-archive";
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

  await supabase.from("company_users").upsert(
    {
      company_id: session.companyId,
      email,
      role: "member",
      is_backup_enabled: true,
    },
    { onConflict: "company_id,email" },
  );

  const archiveCompanyId = company.id;
  const tok = await fetchGoogleTokenRow(supabase, archiveCompanyId, email);
  if (!isGoogleTokenRowConnected(tok)) {
    return NextResponse.json(
      {
        error: `${email} is on the team with backup on. Connect Google for that mailbox once, then backup can run.`,
        connectUrl: "/settings",
        added: true,
      },
      { status: 400 },
    );
  }

  const archived = await runEmailArchiveForUser(supabase, {
    companyId: archiveCompanyId,
    email,
    domain: company.domain,
  });
  if (!archived.success) {
    return NextResponse.json({ error: archived.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, email, filesDone: archived.count, progress: archived.progress });
}
