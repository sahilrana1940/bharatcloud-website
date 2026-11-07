import { NextResponse } from "next/server";

import { sendArchivedMailForward } from "@/lib/email/company-forward";
import { mailArchiveWindowStart, sameCompanyDomain } from "@/lib/email/company-mail-key";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

/** Admin re-sends one archived company copy. From address stays on the company domain. */
export async function POST(req: Request) {
  const auth = await requireWorkspace(true);
  if (auth instanceof NextResponse) return auth;
  const { session, tenant } = auth;

  const body = await req.json().catch(() => ({}));
  const mailId = String(body.mailId || "").trim();
  const to = String(body.to || "").trim().toLowerCase();
  if (!mailId || !to.includes("@")) {
    return NextResponse.json({ error: "mailId and a company address are required" }, { status: 400 });
  }

  const domain = tenant?.company.domain || "";
  if (!domain || !sameCompanyDomain(to, domain)) {
    return NextResponse.json(
      { error: "Forward again only to an address on your company domain" },
      { status: 403 },
    );
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const { data: mail, error } = await supabase
    .from("mails")
    .select("id, subject, from_email, body_text, received_at, company_from_email, company_domain")
    .eq("id", mailId)
    .eq("company_id", session.companyId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!mail) {
    return NextResponse.json({ error: "Mail not found" }, { status: 404 });
  }

  const received = new Date(String(mail.received_at || ""));
  if (Number.isNaN(received.getTime()) || received < mailArchiveWindowStart()) {
    return NextResponse.json({ error: "That mail is outside the 3 year archive search" }, { status: 404 });
  }

  const companyFrom = String(mail.company_from_email || "").toLowerCase();
  if (!sameCompanyDomain(companyFrom, domain)) {
    return NextResponse.json(
      { error: "This copy cannot be forwarded from the company domain" },
      { status: 403 },
    );
  }

  const result = await sendArchivedMailForward({
    companyFromEmail: companyFrom,
    to,
    requestedByEmail: session.email,
    originalSubject: String(mail.subject || "(no subject)"),
    originalFrom: String(mail.from_email || ""),
    originalDate: String(mail.received_at || ""),
    bodyText: String(mail.body_text || ""),
    sendAsCompanyDomain: true,
  });

  const deliveryStatus = result.sent ? "sent" : result.demoQueued ? "demo_logged" : "failed";
  await supabase.from("email_forward_log").insert({
    company_id: session.companyId,
    archived_email_id: mail.id,
    from_company_email: companyFrom,
    requested_by: session.email,
    to_email: to,
    subject: `Fwd: ${mail.subject || "(no subject)"}`,
    body_preview: String(mail.body_text || "").slice(0, 500),
    delivery_status: deliveryStatus,
  });

  if (!result.sent && !result.demoQueued) {
    return NextResponse.json({ error: result.error || "Send failed" }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    from: companyFrom,
    to,
    message: result.sent
      ? `Forwarded again from ${companyFrom} to ${to}.`
      : `Forward saved from ${companyFrom} to ${to}. Mail delivery is waiting on the sending domain.`,
    demoMode: Boolean(result.demoQueued),
  });
}
