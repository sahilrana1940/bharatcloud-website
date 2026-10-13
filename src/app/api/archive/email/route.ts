import { NextResponse } from "next/server";

import { resolveArchiveCompanyId } from "@/lib/archive/resolve-archive-company";
import {
  getEmailArchiveStatus,
  runEmailArchiveForUser,
} from "@/lib/archive/run-email-archive";
import {
  attachWorkspaceCompanyCookie,
  readWorkspaceAuthRepaired,
} from "@/lib/billing/workspace-cookies";
import { resolveCompanyDomain } from "@/lib/workspace/company";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import {
  fetchGoogleTokenRowForWorkspace,
  isGoogleTokenRowConnected,
} from "@/lib/google/token-row";

export const maxDuration = 300;

async function sessionContext() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;

  const repaired = await readWorkspaceAuthRepaired();
  if (!repaired) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { auth: ws, repaired: cookieRepaired } = repaired;
  const domain = await resolveCompanyDomain(ws.companyId, ws.email);

  return { supabase, session: ws, domain, cookieRepaired };
}

/** GET — Gmail archive job status for logged-in user (no billing gate). */
export async function GET() {
  const ctx = await sessionContext();
  if (ctx instanceof NextResponse) return ctx;

  const { supabase, session, cookieRepaired } = ctx;
  const archiveCompanyId = await resolveArchiveCompanyId(
    supabase,
    session.companyId,
    session.email,
  );
  const tokenRow = await fetchGoogleTokenRowForWorkspace(
    supabase,
    archiveCompanyId,
    session.email,
  );
  const googleConnected = isGoogleTokenRowConnected(tokenRow);

  const status = await getEmailArchiveStatus(
    supabase,
    archiveCompanyId,
    session.email,
  );

  const archivedCount = status.archivedCount ?? 0;
  const mailBackupWorking =
    googleConnected && status.status === "completed" && archivedCount > 0;

  const res = NextResponse.json({
    ...status,
    googleConnected,
    companyId: archiveCompanyId,
    email: session.email,
    verification: {
      /** Step 1: OAuth tokens in DB */
      googleConnected,
      /** Step 2: user ran POST /api/archive/email at least once successfully */
      lastJobCompleted: status.status === "completed",
      /** Step 3: rows in archive_files / email_backups for this user */
      hasArchivedMessages: archivedCount > 0,
      /** All three — safe to tell client "mail backup is working" */
      mailBackupWorking,
      hint: !googleConnected
        ? "Connect Gmail first."
        : status.status === "error"
          ? status.lastError || status.progress || "Last backup failed — read error above."
          : archivedCount === 0
            ? 'Tap "Start my email backup" — connect alone does not import mail.'
            : mailBackupWorking
              ? "Mail archive is working."
              : "Run backup again or check Supabase bucket company-vault.",
    },
  });
  const repairCompany = archiveCompanyId !== session.companyId || cookieRepaired;
  if (repairCompany) attachWorkspaceCompanyCookie(res, archiveCompanyId);
  return res;
}

/** POST — start Gmail archiving for logged-in employee (no billing check). */
export async function POST() {
  const ctx = await sessionContext();
  if (ctx instanceof NextResponse) return ctx;

  const { supabase, session, domain, cookieRepaired } = ctx;

  const archiveCompanyId = await resolveArchiveCompanyId(
    supabase,
    session.companyId,
    session.email,
  );

  const result = await runEmailArchiveForUser(supabase, {
    companyId: archiveCompanyId,
    email: session.email,
    domain,
  });

  const res = NextResponse.json(
    result.success
      ? { success: true, count: result.count, status: result.status, progress: result.progress }
      : { success: false, error: result.error, status: result.status },
    { status: result.success ? 200 : 400 },
  );
  if (archiveCompanyId !== session.companyId || cookieRepaired) {
    attachWorkspaceCompanyCookie(res, archiveCompanyId);
  }
  return res;
}
