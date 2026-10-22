import { NextResponse } from "next/server";

import { runE2eGmailBackup } from "@/lib/email/e2e-gmail-backup";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export const maxDuration = 60;

/** Daily 2 AM — archive recent Gmail in small batches so the function stays under the timeout. */
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
  let batch = 0;

  for (const row of tokens || []) {
    if (!row.company_id || !row.email) continue;
    if (Date.now() - started > 240_000) break;
    batch += 1;
    const result = await runE2eGmailBackup(supabase, {
      companyId: row.company_id,
      email: row.email,
      limit: 50,
      batch,
      newerThanDays: 2,
    });
    if (result.ok) {
      ok += 1;
      archived += result.emailCount;
    } else {
      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    processed: batch,
    succeeded: ok,
    failed,
    archived,
  });
}
