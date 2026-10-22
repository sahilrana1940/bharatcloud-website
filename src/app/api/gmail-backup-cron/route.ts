import { NextResponse } from "next/server";

import { resolveMailboxScope } from "@/lib/archive/mailbox-scope";
import { GMAIL_ARCHIVE_BATCH_SIZE } from "@/lib/email/gmail-archive-constants";
import {
  buildGmailQuerySince,
  getLastEmailBackupRunAt,
  runE2eGmailBackup,
} from "@/lib/email/e2e-gmail-backup";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Daily 2 AM IST (20:00 UTC) — archive new Gmail since last email_backup_runs row per mailbox. */
export async function GET(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: true, demo: true, processed: 0 });
  }

  const { data: tokens } = await supabase
    .from("google_oauth_tokens")
    .select("company_id, email")
    .not("refresh_token", "is", null)
    .limit(12);

  let ok = 0;
  let failed = 0;
  let archived = 0;
  const started = Date.now();
  const details: { email: string; archived: number; query?: string; error?: string }[] = [];

  for (const row of tokens || []) {
    if (!row.company_id || !row.email) continue;
    if (Date.now() - started > 52_000) break;

    const scope = await resolveMailboxScope(supabase, row.company_id, row.email);
    const lastRunAt = await getLastEmailBackupRunAt(
      supabase,
      scope.companyId,
      scope.email,
      scope.userId,
    );
    const gmailSearchQuery = buildGmailQuerySince(lastRunAt, 1);

    const result = await runE2eGmailBackup(supabase, {
      companyId: scope.companyId,
      email: scope.email,
      userId: scope.userId,
      limit: GMAIL_ARCHIVE_BATCH_SIZE,
      batch: ok + failed + 1,
      gmailSearchQuery,
    });

    if (result.ok) {
      ok += 1;
      archived += result.emailCount;
      details.push({ email: scope.email, archived: result.emailCount, query: gmailSearchQuery });
    } else {
      failed += 1;
      details.push({ email: scope.email, archived: 0, query: gmailSearchQuery, error: result.error });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: ok + failed,
    succeeded: ok,
    failed,
    archived,
    details,
  });
}
