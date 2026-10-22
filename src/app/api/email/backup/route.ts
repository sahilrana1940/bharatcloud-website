import { NextResponse } from "next/server";

import { handleGmailArchivePost } from "@/lib/email/gmail-archive-api";
import {
  countBackedUpEmails,
  listEmailBackupRuns,
  listFileArchives,
  orgArchiveStorageTotals,
  orgEmailBackupTotals,
  gmailMailboxCount,
  EMAIL_BACKUP_S3_BUCKET,
} from "@/lib/email/e2e-gmail-backup";
import { getE2EBucket } from "@/lib/s3/config";
import { archiveStorageClass } from "@/lib/storage/archiver-from-start";
import { isGmailReconnectError } from "@/lib/google/token-row";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isWorkspaceOwner } from "@/lib/workspace/nav";

export const runtime = "nodejs";
export const maxDuration = 300;

/** GET — backup runs, progress, org totals for admins. */
export async function GET(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      demo: true,
      bucket: getE2EBucket() || EMAIL_BACKUP_S3_BUCKET,
      backedUpCount: 0,
      targetCount: 10000,
      runs: [],
    });
  }

  const url = new URL(req.url);
  const orgScope = url.searchParams.get("org") === "1";
  const owner = isWorkspaceOwner({
    role: session.role,
    saasRole: session.saasRole,
    isCompanyOwner: session.isCompanyOwner,
  });

  const { runs, tableMissing, supabaseError: runsError } = await listEmailBackupRuns(
    supabase,
    session.companyId,
    session.email,
  );

  const backedUpCount = await countBackedUpEmails(
    supabase,
    session.companyId,
    session.email,
  );

  let orgTotals = null;
  if (orgScope && owner) {
    orgTotals = await orgEmailBackupTotals(supabase, session.companyId);
  }

  const active = runs.find(
    (r) => (r as { status?: string }).status === "running",
  ) as { progress?: string; status?: string } | undefined;

  const { archives, tableMissing: archivesMissing, supabaseError: archivesError } = await listFileArchives(
    supabase,
    session.companyId,
    50,
    session.email,
  );
  const storageTotals = await orgArchiveStorageTotals(supabase, session.companyId, session.email);
  const mailbox = await gmailMailboxCount(supabase, session.companyId, session.email);
  const messagesTotal = "messagesTotal" in mailbox ? mailbox.messagesTotal : null;
  const gmailCountError = "error" in mailbox ? mailbox.error : null;
  const supabaseError = runsError || archivesError || null;
  const payload = {
    bucket: getE2EBucket() || EMAIL_BACKUP_S3_BUCKET,
    storageClass: archiveStorageClass(),
    backedUpCount,
    targetCount: 10000,
    runs,
    archives,
    archivesMissing,
    totalArchiveMb: storageTotals.totalMb,
    totalArchiveGb: storageTotals.totalMb / 1024,
    archiveFileCount: storageTotals.fileCount,
    tableMissing,
    progress: active?.progress || "",
    status: active?.status || "idle",
    orgTotals,
    fromStart: true,
    retentionYears: 7,
    messagesTotal,
    gmailCountError,
    tokenExpired: "tokenExpired" in mailbox ? Boolean(mailbox.tokenExpired) : false,
    needsReconnect:
      ("needsReconnect" in mailbox && Boolean(mailbox.needsReconnect)) ||
      isGmailReconnectError(gmailCountError || ""),
    supabaseError,
    lastRun: runs[0] || null,
  };
  if (supabaseError) {
    return NextResponse.json(payload, { status: 503 });
  }
  return NextResponse.json(payload);
}

/** POST — start Gmail → E2E .eml backup (same batch handler as /api/gmail/archive). */
export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  return handleGmailArchivePost(req, supabase, session);
}
