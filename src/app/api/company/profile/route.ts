import { NextResponse } from "next/server";

import { getTenantHandoffStaff, getTenantProfile } from "@/lib/tenant-profile";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      domain: "demo.local",
      adminEmail: session.email,
      profile: null,
    });
  }

  const { data: company, error } = await supabase
    .from("companies")
    .select("domain, admin_email")
    .eq("id", session.companyId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const domain = company.domain as string;
  return NextResponse.json({
    domain,
    adminEmail: company.admin_email as string,
    profile: getTenantProfile(domain),
    handoffStaffEmails: getTenantHandoffStaff(domain),
  });
}
