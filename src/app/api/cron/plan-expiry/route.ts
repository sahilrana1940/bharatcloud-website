import { NextResponse } from "next/server";

import { demoAllUsers, demoUpdateUser } from "@/lib/personal/users-demo";
import { PLAN_LIMITS } from "@/lib/storage/tiers";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const supabase = await getSupabaseOrNull();

  if (!supabase) {
    let downgraded = 0;
    for (const u of demoAllUsers()) {
      if (u.plan_expiry && u.plan_expiry < now && u.plan !== "free") {
        demoUpdateUser(u.email, {
          plan: "free",
          storage_limit: PLAN_LIMITS.free,
          is_paid: false,
          plan_expiry: null,
        });
        downgraded += 1;
      }
    }
    return NextResponse.json({ ok: true, downgraded, demo: true });
  }

  const { data: expired } = await supabase
    .from("personal_users")
    .select("email")
    .lt("plan_expiry", now)
    .neq("plan", "free");

  for (const row of expired || []) {
    await supabase
      .from("personal_users")
      .update({
        plan: "free",
        storage_limit: PLAN_LIMITS.free,
        is_paid: false,
      })
      .eq("email", row.email);
  }

  return NextResponse.json({ ok: true, downgraded: expired?.length || 0 });
}
