import { NextResponse } from "next/server";

import { demoUpdateUser, demoGetUser } from "@/lib/personal/users-demo";
import { PLAN_LIMITS } from "@/lib/storage/tiers";
import { getUploadContext } from "@/lib/personal/access";
import { getSupabaseOrNull } from "@/lib/workspace/db";

const PLANS: Record<string, { amount: number; limit: number; key: string }> = {
  year_20gb: { amount: 19900, limit: PLAN_LIMITS.year_20gb, key: "year_20gb" },
  year_100gb: { amount: 49900, limit: PLAN_LIMITS.year_100gb, key: "year_100gb" },
};

export async function POST(req: Request) {
  const ctx = await getUploadContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await req.json();
  const cfg = PLANS[plan];
  if (!cfg) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const razorpayKey = process.env.RAZORPAY_KEY_ID;
  if (!razorpayKey) {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    const supabase = await getSupabaseOrNull();
    if (!supabase) {
      demoUpdateUser(ctx.email, {
        plan: cfg.key === "year_20gb" ? "plus" : "pro",
        storage_limit: cfg.limit,
        plan_expiry: expires.toISOString(),
        is_paid: true,
      });
      return NextResponse.json({
        ok: true,
        demo: true,
        message: "Plan activated (test mode)",
        plan: demoGetUser(ctx.email),
      });
    }
    await supabase.from("personal_users").upsert({
      email: ctx.email,
      plan: cfg.key === "year_20gb" ? "plus" : "pro",
      storage_limit: cfg.limit,
      plan_expiry: expires.toISOString(),
      is_paid: true,
    });
    return NextResponse.json({ ok: true, demo: true });
  }

  return NextResponse.json({
    ok: true,
    razorpayOrder: {
      amount: cfg.amount,
      currency: "INR",
      receipt: `bc-${plan}-${Date.now()}`,
      key: razorpayKey,
    },
  });
}
