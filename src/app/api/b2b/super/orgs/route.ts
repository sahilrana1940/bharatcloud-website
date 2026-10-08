import { NextResponse } from "next/server";

import { demoMembers, demoOrganizations } from "@/lib/b2b/demo-orgs";
import { isSuperAdminSession } from "@/lib/b2b/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  if (!(await isSuperAdminSession())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const orgs = demoOrganizations.map((org) => ({
      ...org,
      memberCount: demoMembers.filter((m) => m.org_id === org.id).length,
    }));
    return NextResponse.json({ orgs });
  }

  const { data: orgs, error } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const withCounts = await Promise.all(
    (orgs || []).map(async (org) => {
      const { count } = await supabase
        .from("org_members")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org.id);
      return { ...org, memberCount: count ?? 0 };
    }),
  );

  return NextResponse.json({ orgs: withCounts });
}

export async function PATCH(req: Request) {
  if (!(await isSuperAdminSession())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const orgId = String(body.orgId || "");
  if (!orgId) {
    return NextResponse.json({ error: "orgId required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.plan !== undefined) updates.plan = body.plan;
  if (body.storage_limit !== undefined) updates.storage_limit = body.storage_limit;
  if (body.status !== undefined) updates.status = body.status;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const org = demoOrganizations.find((o) => o.id === orgId);
    if (!org) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    Object.assign(org, updates);
    return NextResponse.json({ org });
  }

  const { data, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", orgId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ org: data });
}
