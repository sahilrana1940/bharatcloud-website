import { NextResponse } from "next/server";

import { demoMembers } from "@/lib/b2b/demo-orgs";
import { getB2BCompanyId } from "@/lib/b2b/session";
import { getSupabaseAdmin, type OrgMember } from "@/lib/supabase/server";

export async function GET() {
  const orgId = await getB2BCompanyId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      members: demoMembers.filter((m) => m.org_id === orgId),
    });
  }

  const { data, error } = await supabase
    .from("org_members")
    .select("*")
    .eq("org_id", orgId)
    .order("joined_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ members: data as OrgMember[] });
}

export async function POST(req: Request) {
  const orgId = await getB2BCompanyId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userEmail, role } = await req.json();
  const email = String(userEmail || "").trim().toLowerCase();
  const memberRole = String(role || "member");
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const row: OrgMember = {
      id: `demo-m-${Date.now()}`,
      org_id: orgId,
      user_email: email,
      role: memberRole,
      joined_at: new Date().toISOString(),
    };
    demoMembers.push(row);
    return NextResponse.json({ member: row });
  }

  const { data, error } = await supabase
    .from("org_members")
    .insert({ org_id: orgId, user_email: email, role: memberRole })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ member: data });
}

export async function DELETE(req: Request) {
  const orgId = await getB2BCompanyId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId } = await req.json();
  if (!memberId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const idx = demoMembers.findIndex(
      (m) => m.id === memberId && m.org_id === orgId,
    );
    if (idx >= 0) demoMembers.splice(idx, 1);
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from("org_members")
    .delete()
    .eq("id", memberId)
    .eq("org_id", orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
