import { NextResponse } from "next/server";

import { SUPER_ADMIN_EMAIL } from "@/lib/brand";
import { getUploadContext } from "@/lib/personal/access";
import { demoAllUsers, demoGetUser, demoUpdateUser } from "@/lib/personal/users-demo";
import { demoRecoveryListPending } from "@/lib/personal/recovery-demo";
import { demoStorageStats } from "@/lib/personal/demo-store";
import { VAULT_TABLE } from "@/lib/vault/table";
import { getSupabaseOrNull } from "@/lib/workspace/db";

function guard(email: string | undefined) {
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL;
}

export async function GET() {
  const ctx = await getUploadContext();
  if (!ctx || !guard(ctx.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const users = demoAllUsers();
    const stats = demoStorageStats();
    return NextResponse.json({
      users: users.length,
      storageUsed: stats.hot + stats.cold + stats.vault,
      revenue: users.filter((u) => u.is_paid).length,
      personal_users: users,
      tiers: { hot: stats.hot, cold: stats.cold, vault: stats.vault },
      recovery: demoRecoveryListPending(),
    });
  }

  const { count: users } = await supabase.from("personal_users").select("*", { count: "exact", head: true });
  const { data: usage } = await supabase.from("personal_users").select("storage_used, is_paid");
  const storageUsed = (usage || []).reduce((s, u) => s + Number(u.storage_used || 0), 0);
  const revenue = (usage || []).filter((u) => u.is_paid).length;
  const { data: allUsers } = await supabase.from("personal_users").select("*");
  const { data: recovery } = await supabase.from("recovery_requests").select("*").eq("status", "pending");
  const { data: vaultRows } = await supabase.from(VAULT_TABLE).select("storage_tier");

  const tiers = { hot: 0, cold: 0 };
  for (const r of vaultRows || []) {
    if (r.storage_tier === "cold") tiers.cold += 1;
    else tiers.hot += 1;
  }

  return NextResponse.json({
    users: users || 0,
    storageUsed,
    revenue,
    personal_users: allUsers || [],
    tiers,
    recovery: recovery || [],
  });
}

export async function PATCH(req: Request) {
  const ctx = await getUploadContext();
  if (!ctx || !guard(ctx.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { email, action, plan } = body;
  const supabase = await getSupabaseOrNull();

  if (!supabase) {
    if (action === "block") demoUpdateUser(email, { is_blocked: true });
    if (action === "unblock") demoUpdateUser(email, { is_blocked: false });
    if (action === "plan" && plan === "free") {
      demoUpdateUser(email, { plan: "free", storage_limit: 2 * 1024 ** 3, is_paid: false });
    }
    if (action === "plan" && plan === "plus") {
      demoUpdateUser(email, { plan: "plus", storage_limit: 20 * 1024 ** 3, is_paid: true });
    }
    if (action === "plan" && plan === "pro") {
      demoUpdateUser(email, { plan: "pro", storage_limit: 100 * 1024 ** 3, is_paid: true });
    }
    return NextResponse.json({ ok: true, user: demoGetUser(email) });
  }

  if (action === "block") {
    await supabase.from("personal_users").update({ is_blocked: true }).eq("email", email);
  }
  if (action === "unblock") {
    await supabase.from("personal_users").update({ is_blocked: false }).eq("email", email);
  }
  if (action === "plan") {
    const limits: Record<string, number> = {
      free: 2 * 1024 ** 3,
      plus: 20 * 1024 ** 3,
      pro: 100 * 1024 ** 3,
    };
    await supabase
      .from("personal_users")
      .update({
        plan,
        storage_limit: limits[plan] || limits.free,
        is_paid: plan !== "free",
      })
      .eq("email", email);
  }

  return NextResponse.json({ ok: true });
}
