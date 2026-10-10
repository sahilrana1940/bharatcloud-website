import { NextResponse } from "next/server";

import { getSessionRole } from "@/lib/auth";
import { SUPER_ADMIN_EMAIL } from "@/lib/b2b/constants";
import { demoRecoveryListPending, demoRecoveryUpdate } from "@/lib/personal/recovery-demo";
import { sendRecoveryCodeEmail } from "@/lib/email/recovery-mail";
import { generateBackupCode, hashBackupCode } from "@/lib/personal/pin";
import { getSupabaseOrNull } from "@/lib/workspace/db";

async function guard() {
  const role = await getSessionRole();
  return role?.role === "super_admin" || role?.email === SUPER_ADMIN_EMAIL;
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ requests: demoRecoveryListPending() });
  }
  const { data } = await supabase
    .from("recovery_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return NextResponse.json({ requests: data || [] });
}

export async function POST(req: Request) {
  if (!(await guard())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { requestId } = await req.json();
  const plain = generateBackupCode();
  const hash = hashBackupCode(plain);
  const expires = new Date(Date.now() + 3600_000).toISOString();

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const pending = demoRecoveryListPending().find((r) => r.id === requestId);
    demoRecoveryUpdate(requestId, {
      status: "approved",
      backup_code_hash: hash,
      backup_code_plain_temp: plain,
      code_expires_at: expires,
    });
    const mail = pending
      ? await sendRecoveryCodeEmail(pending.contact_mail, plain, pending.user_email)
      : { sent: false };
    if (!mail.sent) {
      console.log(`[recovery] mail to ${pending?.contact_mail} code ${plain}`);
    }
    return NextResponse.json({
      ok: true,
      code: plain,
      emailSent: mail.sent,
      mailError: mail.error,
    });
  }

  const { data: row } = await supabase
    .from("recovery_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase
    .from("recovery_requests")
    .update({
      status: "approved",
      backup_code_hash: hash,
      backup_code_plain_temp: plain,
      code_expires_at: expires,
    })
    .eq("id", requestId);

  const { data: existingLock } = await supabase
    .from("app_locks")
    .select("pin_hash")
    .eq("user_email", row.user_email)
    .maybeSingle();
  await supabase.from("app_locks").upsert({
    user_email: row.user_email,
    pin_hash: existingLock?.pin_hash || hash,
    backup_code_hash: hash,
  });

  const mail = await sendRecoveryCodeEmail(
    row.contact_mail,
    plain,
    row.user_email,
  );
  if (!mail.sent) {
    console.log(`[recovery] mail to ${row.contact_mail} code ${plain}`);
  }

  return NextResponse.json({
    ok: true,
    code: plain,
    contact_mail: row.contact_mail,
    emailSent: mail.sent,
    mailError: mail.error,
  });
}
