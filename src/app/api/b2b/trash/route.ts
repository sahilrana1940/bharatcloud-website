import { NextResponse } from "next/server";

import { getB2BCompanyId } from "@/lib/b2b/session";
import { demoTrash } from "@/lib/b2b/demo-store";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const companyId = await getB2BCompanyId();
  if (!companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      items: demoTrash.filter((t) => t.company_id === companyId),
    });
  }

  const { data, error } = await supabase
    .from("vault_trash")
    .select("*")
    .eq("company_id", companyId)
    .order("deleted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data });
}
