import { NextResponse } from "next/server";

import { runE2eGmailBackup } from "@/lib/email/e2e-gmail-backup";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Daily archive: 25 messages per mailbox so the function stays inside the Vercel limit. */
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
    .limit(8);

  let ok = 0;
  let failed = 0;
  let archived = 0;
  const started = Date.now();

  for (const row of tokens || []) {
    if (!row.company_id || !row.email) continue;
    if (Date.now() - started > 240_000) break;
    const result = await runE2eGmailBackup(supabase, {
      companyId: row.company_id,
      email: row.email,
      limit: 25,
      batch: ok + failed + 1,
      newerThanDays: 2,
    });
    if (result.ok) {
      ok += 1;
      archived += result.emailCount;
      console.log(`Batch ${ok + failed} archived ${result.emailCount} emails`);
    } else {
      failed += 1;
      console.error(result.error);
    }
  }

  return NextResponse.json({ ok: failed === 0, processed: ok + failed, succeeded: ok, failed, archived });
}
