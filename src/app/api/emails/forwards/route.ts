import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { resolveArchiveCompanyId } from "@/lib/archive/resolve-archive-company";

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ forwards: [] });
  }

  const companyId = await resolveArchiveCompanyId(
    supabase,
    session.companyId,
    session.email,
  );

  const { data, error } = await supabase
    .from("email_forward_log")
    .select("id, to_email, subject, delivery_status, created_at, from_company_email")
    .eq("company_id", companyId)
    .eq("requested_by", session.email.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(30);

  if (error?.message.includes("email_forward_log")) {
    return NextResponse.json({ forwards: [], migrationRequired: true });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ forwards: data || [] });
}
