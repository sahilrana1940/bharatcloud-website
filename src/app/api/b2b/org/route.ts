import { NextResponse } from "next/server";

import { demoMembers, demoOrganizations } from "@/lib/b2b/demo-orgs";
import { getB2BCompanyId } from "@/lib/b2b/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const orgId = await getB2BCompanyId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const org = demoOrganizations.find((o) => o.id === orgId);
    if (!org) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const memberCount = demoMembers.filter((m) => m.org_id === orgId).length;
    return NextResponse.json({ org, memberCount });
  }

  const { data: org, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (error || !org) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { count } = await supabase
    .from("org_members")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);

  return NextResponse.json({ org, memberCount: count ?? 0 });
}
