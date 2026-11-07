import { NextResponse } from "next/server";

import { denyUnlessSuperAdmin } from "@/lib/super-admin/guard";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const auth = await denyUnlessSuperAdmin();
  if (auth.response) return auth.response;
  const supabase = await getSupabaseOrNull();
  if (!supabase) return NextResponse.json({ companies: [], error: "Supabase is not configured" }, { status: 503 });

  const { data, error } = await supabase.from("companies").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ companies: [], error: error.message }, { status: 500 });
  return NextResponse.json({ companies: data || [] });
}
