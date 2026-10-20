import { NextResponse } from "next/server";

import { resolveArchiveCompanyId } from "@/lib/archive/resolve-archive-company";
import { listPersonalUsersForCompany } from "@/lib/company-admin/stats";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isWorkspaceOwner } from "@/lib/workspace/nav";
import { getWorkspaceSession } from "@/lib/workspace/session";

export const dynamic = "force-dynamic";

/** Copy this company's personal_users into team_members so one device can sign the team. */
export async function POST() {
  const session = await getWorkspaceSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (
    !isWorkspaceOwner({
      role: session.role,
      saasRole: session.saasRole,
      isCompanyOwner: session.isCompanyOwner,
    })
  ) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data: company } = await supabase
    .from("companies")
    .select("id, domain")
    .eq("id", session.companyId)
    .maybeSingle();

  const companyId = company?.id
    ? await resolveArchiveCompanyId(supabase, company.id, session.email)
    : session.companyId;

  const { data: resolved } = await supabase
    .from("companies")
    .select("id, domain")
    .eq("id", companyId)
    .maybeSingle();

  const domain = String(resolved?.domain || company?.domain || "");
  const users = await listPersonalUsersForCompany(supabase, companyId, domain);
  const emails = [...new Set(users.map((row) => String(row.email || "").trim().toLowerCase()).filter((email) => email.includes("@")))];

  if (!emails.length) {
    return NextResponse.json({ synced: 0, companyId });
  }

  const rows = emails.map((email) => ({
    email,
    company_domain: domain,
    role: "member",
    status: "active",
  }));

  const { error } = await supabase.from("team_members").upsert(rows, { onConflict: "email" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ synced: rows.length, companyId });
}
