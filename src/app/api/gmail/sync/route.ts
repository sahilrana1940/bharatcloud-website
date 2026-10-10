import { NextResponse } from "next/server";

import { gmailClient } from "@/lib/google/client";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { resolveCompanyDomain } from "@/lib/workspace/company";
import { DEMO_EMAILS } from "@/lib/workspace/demo-data";
import { BUCKET_COMPANY_HOT } from "@/lib/storage/tiers";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export const maxDuration = 300;

const BUCKET = BUCKET_COMPANY_HOT;

async function runGmailSync(
  session: { companyId: string; email: string },
  userFilter: string | undefined,
  domain: string,
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseOrNull>>>,
) {
  let membersQuery = supabase
    .from("team_members")
    .select("email")
    .eq("company_domain", domain);
  if (userFilter) membersQuery = membersQuery.eq("email", userFilter);

  let { data: members } = await membersQuery;
  if (!members?.length) {
    let fallback = supabase
      .from("company_users")
      .select("email")
      .eq("company_id", session.companyId);
    if (userFilter) fallback = fallback.eq("email", userFilter);
    const { data } = await fallback;
    members = data;
  }
  let imported = 0;

  for (const m of members || []) {
    await supabase
      .from("company_users")
      .update({ email_sync_status: "syncing", email_sync_progress: "0/100" })
      .eq("company_id", session.companyId)
      .eq("email", m.email);

    const { data: tokenRow } = await supabase
      .from("google_oauth_tokens")
      .select("access_token, refresh_token")
      .eq("company_id", session.companyId)
      .eq("email", m.email)
      .maybeSingle();

    if (!tokenRow?.access_token) {
      await supabase
        .from("company_users")
        .update({ email_sync_status: "error" })
        .eq("company_id", session.companyId)
        .eq("email", m.email);
      continue;
    }

    const gmail = gmailClient(tokenRow.access_token);
    if (!gmail) continue;

    const list = await gmail.users.messages.list({ userId: "me", maxResults: 100 });
    const total = list.data.messages?.length || 0;
    let i = 0;

    for (const msg of list.data.messages || []) {
      if (!msg.id) continue;
      i += 1;
      const full = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });
      const headers = full.data.payload?.headers || [];
      const subject = headers.find((h) => h.name === "Subject")?.value || "";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const to = headers.find((h) => h.name === "To")?.value || "";
      const dateStr = headers.find((h) => h.name === "Date")?.value;
      const labels = full.data.labelIds || [];
      const folder = labels.includes("SENT") ? "SENT" : "INBOX";
      const parts = full.data.payload?.parts || [];
      const attPart = parts.find((p) => p.filename && p.body?.attachmentId);
      const hasAtt = Boolean(attPart?.filename);
      let s3Path: string | null = null;

      if (attPart?.body?.attachmentId && tokenRow.refresh_token) {
        try {
          const att = await gmail.users.messages.attachments.get({
            userId: "me",
            messageId: msg.id,
            id: attPart.body.attachmentId,
          });
          const raw = att.data.data;
          if (raw) {
            const buf = Buffer.from(raw, "base64url");
            s3Path = `emails/${domain}/${m.email}/${attPart.body.attachmentId}`;
            await supabase.storage.from(BUCKET).upload(s3Path, buf, {
              upsert: true,
              contentType: attPart.mimeType || "application/octet-stream",
            });
          }
        } catch {
          /* skip attachment */
        }
      }

      await supabase.from("email_backups").upsert(
        {
          company_id: session.companyId,
          company_domain: domain,
          owner_email: m.email,
          gmail_id: msg.id,
          thread_id: full.data.threadId,
          subject,
          from_email: from,
          to_email: to,
          date: dateStr ? new Date(dateStr).toISOString() : null,
          body_text: full.data.snippet || subject,
          has_attachment: hasAtt,
          folder,
          s3_path: s3Path,
        },
        { onConflict: "company_id,gmail_id" },
      );
      imported += 1;
      await supabase
        .from("company_users")
        .update({ email_sync_progress: `${i}/${total}` })
        .eq("company_id", session.companyId)
        .eq("email", m.email);
    }

    await supabase
      .from("company_users")
      .update({ email_sync_status: "synced", email_sync_progress: `${imported} synced` })
      .eq("company_id", session.companyId)
      .eq("email", m.email);
  }

  return imported;
}

export async function POST(req: Request) {
  const auth = await requireWorkspace(true);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const url = new URL(req.url);
  const userFilter =
    url.searchParams.get("user_email")?.toLowerCase() ||
    url.searchParams.get("user")?.toLowerCase();
  const supabase = await getSupabaseOrNull();
  const domain =
    url.searchParams.get("company_domain") ||
    (await resolveCompanyDomain(session.companyId, session.email));

  if (!supabase) {
    return NextResponse.json({ ok: true, imported: DEMO_EMAILS.length, demo: true });
  }

  void runGmailSync(session, userFilter, domain, supabase).catch(() => {
    /* logged via user sync status */
  });

  return NextResponse.json({ ok: true, status: "started" });
}
