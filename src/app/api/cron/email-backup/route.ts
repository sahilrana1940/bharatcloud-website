import { NextResponse } from "next/server";

import { runE2eGmailBackup } from "@/lib/email/e2e-gmail-backup";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export const maxDuration = 300;

/** Daily 2 AM — backup Gmail for users with Google tokens (service role). */
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
    .limit(50);

  let ok = 0;
  let failed = 0;

  for (const row of tokens || []) {
    if (!row.company_id || !row.email) continue;
    const result = await runE2eGmailBackup(supabase, {
      companyId: row.company_id,
      email: row.email,
      maxMessages: 100,
    });
    if (result.ok) ok += 1;
    else failed += 1;
  }

  return NextResponse.json({
    ok: true,
    processed: (tokens || []).length,
    succeeded: ok,
    failed,
  });
}
