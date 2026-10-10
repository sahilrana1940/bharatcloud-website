import { NextResponse } from "next/server";

import { demoGetUser, demoUpdateUser } from "@/lib/personal/users-demo";
import { PLAN_LIMITS } from "@/lib/storage/tiers";
import { getUploadContext } from "@/lib/personal/access";
import { getSupabaseOrNull } from "@/lib/workspace/db";

const PLANS: Record<string, { limit: number; plan: string }> = {
  plus: { limit: PLAN_LIMITS.year_20gb, plan: "plus" },
  pro: { limit: PLAN_LIMITS.year_100gb, plan: "pro" },
  year_20gb: { limit: PLAN_LIMITS.year_20gb, plan: "plus" },
  year_100gb: { limit: PLAN_LIMITS.year_100gb, plan: "pro" },
};

export async function POST(req: Request) {
  const ctx = await getUploadContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan, razorpay_payment_id } = await req.json();
  const cfg = PLANS[plan];
  if (!cfg) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    demoUpdateUser(ctx.email, {
      plan: cfg.plan as "plus" | "pro",
      storage_limit: cfg.limit,
      plan_expiry: expiry.toISOString(),
      is_paid: true,
    });
    return NextResponse.json({ ok: true, user: demoGetUser(ctx.email), payment: razorpay_payment_id });
  }

  await supabase.from("personal_users").upsert({
    email: ctx.email,
    plan: cfg.plan,
    storage_limit: cfg.limit,
    storage_used: 0,
    plan_expiry: expiry.toISOString(),
    is_paid: true,
  });

  return NextResponse.json({ ok: true });
}
