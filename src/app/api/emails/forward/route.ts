import { NextResponse } from "next/server";

import { resolveArchiveCompanyId } from "@/lib/archive/resolve-archive-company";
import { sendArchivedMailForward } from "@/lib/email/company-forward";
import { loadArchivedEmailForForward } from "@/lib/email/load-archived-body";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isWorkspaceOwner } from "@/lib/workspace/nav";

/** Staff may only forward their own archived mail; sent from company admin_email. */
export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const body = await req.json().catch(() => ({}));
  const emailId = String(body.emailId || "").trim();
  const to = String(body.to || "").trim().toLowerCase();
  if (!emailId || !to || !to.includes("@")) {
    return NextResponse.json({ error: "emailId and valid to address required" }, { status: 400 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const companyId = await resolveArchiveCompanyId(
    supabase,
    session.companyId,
    session.email,
  );

  const row = await loadArchivedEmailForForward(supabase, emailId, companyId);
  if (!row) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  const owner = String(row.owner_email || "").toLowerCase();
  const me = session.email.toLowerCase();
  const adminView = isWorkspaceOwner({
    role: session.role,
    saasRole: session.saasRole,
    isCompanyOwner: session.isCompanyOwner,
  });

  if (!adminView && owner !== me) {
    return NextResponse.json(
      { error: "You can only forward mail archived for your own mailbox." },
      { status: 403 },
    );
  }

  const { data: company } = await supabase
    .from("companies")
    .select("admin_email")
    .eq("id", companyId)
    .maybeSingle();

  const companyFrom = String(company?.admin_email || "").toLowerCase();
  if (!companyFrom) {
    return NextResponse.json({ error: "Company mail not set" }, { status: 400 });
  }

  const result = await sendArchivedMailForward({
    companyFromEmail: companyFrom,
    to,
    requestedByEmail: me,
    originalSubject: String(row.subject || "(no subject)"),
    originalFrom: String(row.from_email || ""),
    originalDate: String(row.date || ""),
    bodyText: String(row.body_text || ""),
  });

  const deliveryStatus = result.sent ? "sent" : result.demoQueued ? "demo_logged" : "failed";

  const logRow = {
    company_id: companyId,
    archived_email_id: row.id,
    from_company_email: companyFrom,
    requested_by: me,
    to_email: to,
    subject: `Fwd: ${row.subject || "(no subject)"}`,
    body_preview: String(row.body_text || "").slice(0, 500),
    delivery_status: deliveryStatus,
  };

  const { error: logErr } = await supabase.from("email_forward_log").insert(logRow);
  if (logErr && !logErr.message.includes("email_forward_log")) {
    console.warn("[forward] log insert", logErr.message);
  }

  if (!result.sent && !result.demoQueued) {
    return NextResponse.json({ error: result.error || "Send failed" }, { status: 502 });
  }

  let message = result.sent
    ? `Forwarded successfully. Check ${to} inbox (and spam).`
    : `Forward saved in BharatCloud — recipient: ${to}.`;

  if (result.demoQueued && result.error?.includes("domain is not verified")) {
    message =
      `Forward logged (inbox not sent yet). Resend par gorjrmcourier.com domain verify karo, ` +
      `ya Vercel par COMPANY_MAIL_FROM=onboarding@resend.dev (test). Neeche "Recent forwards" me dikhega.`;
  } else if (result.demoQueued) {
    message =
      `Forward logged for ${to}. Real email ke liye Resend domain verify karo ya COMPANY_MAIL_FROM set karo.`;
  }

  return NextResponse.json({
    ok: true,
    message,
    from: companyFrom,
    demoMode: Boolean(result.demoQueued),
    deliveryStatus,
  });
}
