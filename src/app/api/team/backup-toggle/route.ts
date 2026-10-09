import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { DEMO_USERS } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function PATCH(req: Request) {
  const auth = await requireWorkspace(true);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const { userId, enabled } = await req.json();

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const u = DEMO_USERS.find((x) => x.id === userId);
    if (u) u.is_backup_enabled = Boolean(enabled);
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("company_users")
    .update({ is_backup_enabled: Boolean(enabled) })
    .eq("id", userId)
    .eq("company_id", session.companyId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
