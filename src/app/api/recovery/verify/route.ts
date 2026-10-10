import { NextResponse } from "next/server";

import { demoRecoveryFindByEmailCode } from "@/lib/personal/recovery-demo";
import { demoGetLock, demoSetLock } from "@/lib/personal/locks-demo";
import { hashBackupCode } from "@/lib/personal/pin";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function POST(req: Request) {
  const { user_email, code } = await req.json();
  if (!user_email || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const normalized = user_email.toLowerCase();
  const codeClean = String(code).replace(/\s/g, "");

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const row = demoRecoveryFindByEmailCode(normalized, codeClean, hashBackupCode);
    if (!row) return NextResponse.json({ error: "Invalid code" }, { status: 401 });
    const lock = demoGetLock(normalized);
    if (lock) demoSetLock({ ...lock, is_device_locked: false });
    return NextResponse.json({ ok: true, recovery: true });
  }

  const { data: row } = await supabase
    .from("recovery_requests")
    .select("*")
    .eq("user_email", normalized)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row?.backup_code_hash || row.backup_code_hash !== hashBackupCode(codeClean)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }
  if (row.code_expires_at && new Date(row.code_expires_at) < new Date()) {
    return NextResponse.json({ error: "Code expired — request again" }, { status: 401 });
  }

  await supabase
    .from("app_locks")
    .update({ is_device_locked: false, failed_attempts: 0 })
    .eq("user_email", normalized);

  return NextResponse.json({ ok: true, recovery: true });
}
