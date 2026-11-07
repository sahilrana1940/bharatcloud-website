import { NextResponse } from "next/server";

import { gmailClient } from "@/lib/google/client";
import { getValidGoogleAccessToken } from "@/lib/google/access-token";
import { denyUnlessSuperAdmin } from "@/lib/super-admin/guard";
import { OWNER_EMAIL } from "@/lib/super-admin/locked-spec";
import { getSupabaseOrNull } from "@/lib/workspace/db";

type GmailHeader = { name?: string | null; value?: string | null };

function header(headers: GmailHeader[] | undefined, name: string) {
  return headers?.find((item) => item.name?.toLowerCase() === name)?.value || "";
}

async function ownerToken(supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseOrNull>>>) {
  const { data } = await supabase
    .from("google_oauth_tokens")
    .select("company_id")
    .eq("email", OWNER_EMAIL)
    .limit(1)
    .maybeSingle();
  const companyId = String(data?.company_id || "");
  if (!companyId) return null;
  return getValidGoogleAccessToken(supabase, companyId, OWNER_EMAIL);
}

export async function GET() {
  const auth = await denyUnlessSuperAdmin();
  if (auth.response) return auth.response;
  const supabase = await getSupabaseOrNull();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured", messages: [], logs: [] }, { status: 503 });

  const logsQuery = await supabase.from("mail_logs").select("*").order("created_at", { ascending: false }).limit(50);
  const token = await ownerToken(supabase).catch(() => null);
  if (!token) {
    return NextResponse.json({
      mailbox: OWNER_EMAIL,
      connected: false,
      messages: [],
      logs: logsQuery.data || [],
      error: `Gmail is not connected for ${OWNER_EMAIL}`,
    });
  }

  const gmail = gmailClient(token);
  if (!gmail) return NextResponse.json({ error: "Gmail client is not configured", messages: [], logs: logsQuery.data || [] }, { status: 503 });

  const list = await gmail.users.messages.list({ userId: "me", maxResults: 20 });
  const messages = [];
  for (const item of list.data.messages || []) {
    if (!item.id) continue;
    const full = await gmail.users.messages.get({
      userId: "me",
      id: item.id,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date"],
    });
    const headers = full.data.payload?.headers as GmailHeader[] | undefined;
    const row = {
      id: item.id,
      from: header(headers, "From"),
      subject: header(headers, "Subject"),
      date: header(headers, "Date"),
      snippet: full.data.snippet || "",
      unread: (full.data.labelIds || []).includes("UNREAD"),
    };
    messages.push(row);
    await supabase.from("mail_logs").upsert(
      {
        gmail_id: row.id,
        mailbox: OWNER_EMAIL,
        from_email: row.from,
        subject: row.subject,
        snippet: row.snippet,
        read: !row.unread,
      },
      { onConflict: "gmail_id" },
    );
  }

  const logs = await supabase.from("mail_logs").select("*").order("created_at", { ascending: false }).limit(50);
  return NextResponse.json({
    mailbox: OWNER_EMAIL,
    connected: true,
    messages,
    logs: logs.data || logsQuery.data || [],
    archiveWarning: logs.error?.message || null,
  });
}

export async function POST(req: Request) {
  const auth = await denyUnlessSuperAdmin();
  if (auth.response) return auth.response;
  const supabase = await getSupabaseOrNull();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: "reply" | "read";
    id?: string;
    to?: string;
    subject?: string;
    body?: string;
    unread?: boolean;
  };

  const token = await ownerToken(supabase);
  const gmail = token ? gmailClient(token) : null;
  if (!gmail) {
    return NextResponse.json({ error: `Gmail is not connected for ${OWNER_EMAIL}` }, { status: 400 });
  }

  if (body.action === "read" && body.id) {
    await gmail.users.messages.modify({
      userId: "me",
      id: body.id,
      requestBody: body.unread ? { addLabelIds: ["UNREAD"] } : { removeLabelIds: ["UNREAD"] },
    });
    await supabase.from("mail_logs").update({ read: !body.unread }).eq("gmail_id", body.id);
    return NextResponse.json({ ok: true });
  }

  const raw = [`To: ${body.to || ""}`, `Subject: ${body.subject || "Re:"}`, "Content-Type: text/plain; charset=utf-8", "", body.body || ""].join("\r\n");
  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: Buffer.from(raw).toString("base64url"), threadId: body.id },
  });
  return NextResponse.json({ ok: true });
}
