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
  if (!supabase) return NextResponse.json({ requests: [] });

  const { data, error } = await supabase
    .from("company_users")
    .select("id, email, company_id, google_connect_status, created_at")
    .eq("google_connect_status", "pending_approval")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const companyIds = [...new Set((data || []).map((r) => r.company_id as string))];
  const { data: companies } = await supabase
    .from("companies")
    .select("id, domain")
    .in("id", companyIds.length ? companyIds : ["00000000-0000-0000-0000-000000000000"]);

  const domainById = new Map((companies || []).map((c) => [c.id as string, c.domain as string]));

  return NextResponse.json({
    requests: (data || []).map((r) => ({
      id: r.id,
      email: r.email,
      companyId: r.company_id,
      domain: domainById.get(r.company_id as string) || "—",
      createdAt: r.created_at,
    })),
  });
}

export async function PATCH(req: Request) {
  const denied = await guard();
  if (denied) return denied;

  const { memberId, action } = await req.json();
  if (!memberId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "memberId and action approve|reject required" }, { status: 400 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) return NextResponse.json({ ok: true });

  const status = action === "approve" ? "approved" : "rejected";
  const { error } = await supabase
    .from("company_users")
    .update({ google_connect_status: status })
    .eq("id", memberId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, status });
}
