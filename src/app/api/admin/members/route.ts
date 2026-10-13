import { NextResponse } from "next/server";

import { isPlatformAdminSession } from "@/lib/admin/access";
import { getSessionRole } from "@/lib/auth";
import { getSupabaseOrNull } from "@/lib/workspace/db";

async function guard() {
  const role = await getSessionRole();
  if (!isPlatformAdminSession(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ members: [] });
  }

  const { data, error } = await supabase
    .from("company_users")
    .select("id, email, company_id, role, saas_role, google_connect_status, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const companyIds = [...new Set((data || []).map((r) => r.company_id as string))];
  const { data: companies } = await supabase
    .from("companies")
    .select("id, domain")
    .in("id", companyIds.length ? companyIds : ["00000000-0000-0000-0000-000000000000"]);

  const domainById = new Map((companies || []).map((c) => [c.id as string, c.domain as string]));

  const members = (data || []).map((r) => ({
    id: r.id,
    email: r.email,
    companyId: r.company_id,
    domain: domainById.get(r.company_id as string) || "—",
    role: r.role,
    saasRole: r.saas_role,
    googleConnectStatus: r.google_connect_status || "approved",
    createdAt: r.created_at,
  }));

  return NextResponse.json({ members });
}

export async function DELETE(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const { memberId } = await req.json();
  if (!memberId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("company_users").delete().eq("id", memberId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
