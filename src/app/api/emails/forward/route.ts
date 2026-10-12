import { NextResponse } from "next/server";

import { sendArchivedMailForward } from "@/lib/email/company-forward";
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

  type Row = {
    company_id: string;
    owner_email: string;
    subject: string | null;
    from_email: string | null;
    date: string | null;
    body_text: string | null;
  };

  let row: Row | null = null;

  const { data: archiveRow } = await supabase
    .from("archive_files")
    .select(
      "company_id, owner_email, subject, from_email, message_date, file_name, metadata",
    )
    .eq("id", emailId)
    .eq("company_id", session.companyId)
    .eq("type", "email")
    .maybeSingle();

  if (archiveRow) {
    row = {
      company_id: archiveRow.company_id as string,
      owner_email: String(archiveRow.owner_email || ""),
      subject: (archiveRow.subject as string) || (archiveRow.file_name as string),
      from_email: (archiveRow.from_email as string) || null,
      date: (archiveRow.message_date as string) || null,
      body_text: (archiveRow.subject as string) || "",
    };
  } else {
    const { data: backupRow, error } = await supabase
      .from("email_backups")
      .select(
        "id, company_id, owner_email, subject, from_email, date, body_text",
      )
      .eq("id", emailId)
      .eq("company_id", session.companyId)
      .maybeSingle();
    if (!error && backupRow) row = backupRow as Row;
  }

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
    .eq("id", session.companyId)
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

  if (!result.sent) {
    return NextResponse.json({ error: result.error || "Send failed" }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    message: `Forwarded from ${companyFrom}. Recipient can reply to company mail.`,
    from: companyFrom,
  });
}
