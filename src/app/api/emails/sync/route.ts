import { NextResponse } from "next/server";

import { assertEmailBackupEnabled } from "@/lib/backup/email-backup-guard";
import { getValidGoogleAccessToken } from "@/lib/google/access-token";
import { gmailClient } from "@/lib/google/client";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function POST() {
  const disabled = assertEmailBackupEnabled();
  if (disabled) return disabled;

  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ message: "Demo email sync", imported: 1 });
  }

  const { data: users } = await supabase
    .from("company_users")
    .select("email")
    .eq("company_id", session.companyId)
    .eq("is_backup_enabled", true);

  let imported = 0;
  for (const u of users || []) {
    const accessToken = await getValidGoogleAccessToken(
      supabase,
      session.companyId,
      u.email,
    );
    if (!accessToken) continue;

    const gmail = gmailClient(accessToken);
    if (!gmail) continue;

    const list = await gmail.users.messages.list({
      userId: "me",
      maxResults: 25,
    });

    for (const m of list.data.messages || []) {
      if (!m.id) continue;
      const full = await gmail.users.messages.get({
        userId: "me",
        id: m.id,
        format: "metadata",
        metadataHeaders: ["Subject", "From", "Date"],
      });
      const headers = full.data.payload?.headers || [];
      const subject = headers.find((h) => h.name === "Subject")?.value || "";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const dateStr = headers.find((h) => h.name === "Date")?.value;
      await supabase.from("email_backups").upsert(
        {
          company_id: session.companyId,
          owner_email: u.email,
          gmail_id: m.id,
          subject,
          from_email: from,
          date: dateStr ? new Date(dateStr).toISOString() : null,
          has_attachment: Boolean(full.data.payload?.parts?.length),
          body_text: subject,
          s3_path: `${u.email}/mails/${m.id}.eml`,
        },
        { onConflict: "company_id,gmail_id" },
      );
      imported += 1;
    }
  }

  return NextResponse.json({ ok: true, imported });
}
