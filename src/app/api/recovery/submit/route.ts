import { NextResponse } from "next/server";

import { demoRecoveryInsert } from "@/lib/personal/recovery-demo";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function POST(req: Request) {
  const { user_email, contact_mail, reason } = await req.json();
  if (!user_email || !contact_mail || !reason) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const row = demoRecoveryInsert({
      id: `rec-${Date.now()}`,
      user_email: user_email.toLowerCase(),
      contact_mail,
      reason,
      status: "pending",
      backup_code_hash: null,
      backup_code_plain_temp: null,
      code_expires_at: null,
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, id: row.id });
  }

  const { data, error } = await supabase
    .from("recovery_requests")
    .insert({
      user_email: user_email.toLowerCase(),
      contact_mail,
      reason,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
