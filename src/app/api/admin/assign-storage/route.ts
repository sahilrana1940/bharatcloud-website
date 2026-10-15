import { NextRequest, NextResponse } from "next/server"
import { PLANS } from "@/plans"
import { isPlatformAdminSession } from "@/lib/admin/access";
import { getSessionRole } from "@/lib/auth";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function POST(req: NextRequest) {
  const role = await getSessionRole();
  if (!isPlatformAdminSession(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { companySlug, planKey, customGB } = await req.json()
  const plan = PLANS[planKey as keyof typeof PLANS]
  const totalGB = customGB ? Number(customGB) : plan?.storage || 50
  const perUserGB = Math.floor(totalGB / (plan?.users || 5))

  const supabase = await getSupabaseOrNull();
  if (!supabase) return NextResponse.json({ success: true, totalGB, perUserGB })

  // Try organizations table first (teri photo me yahi hai)
  let { data } = await supabase.from("organizations").select("id").or(`id.eq.${companySlug},domain.eq.${companySlug}`).limit(1).single();
  let table = "organizations";
  let id = data?.id;

  if (!id) {
    const { data: comp } = await supabase.from("companies").select("id").or(`id.eq.${companySlug},domain.eq.${companySlug}`).limit(1).single();
    if (comp) { table = "companies"; id = comp.id; }
  }

  if (!id) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const { error } = await supabase.from(table).update({
    total_storage_gb: totalGB,
    per_user_gb: perUserGB,
    max_users: plan?.users || 5,
    storage_plan: planKey,
  }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message, hint: `Add columns in ${table}` }, { status: 500 });

  return NextResponse.json({ success: true, companySlug, totalGB, perUserGB, table });
}