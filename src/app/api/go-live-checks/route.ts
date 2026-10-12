import { NextResponse } from "next/server";

import { evaluateGoLiveChecks } from "@/lib/go-live/checks";
import { getTenantHandoffStaff } from "@/lib/tenant-profile";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isWorkspaceOwner } from "@/lib/workspace/nav";

function buildChecklistEmails(
  adminEmail: string,
  memberEmails: string[],
  plannedStaff: string[],
): string[] {
  const admin = adminEmail.toLowerCase();
  const out: string[] = [admin];
  const pool = memberEmails
    .map((e) => e.toLowerCase())
    .filter((e) => e !== admin && e.includes("@"));

  for (const e of pool) {
    if (out.length >= 4) break;
    if (!out.includes(e)) out.push(e);
  }

  for (const e of plannedStaff) {
    if (out.length >= 4) break;
    const p = e.trim().toLowerCase();
    if (p.includes("@") && !out.includes(p)) out.push(p);
  }

  return out;
}

export async function GET(req: Request) {
  const auth = await requireWorkspace(true);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  if (
    !isWorkspaceOwner({
      role: session.role,
      saasRole: session.saasRole,
      isCompanyOwner: session.isCompanyOwner,
    })
  ) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const url = new URL(req.url);
  const companyId = (url.searchParams.get("company_id") || session.companyId).trim();
  if (companyId !== session.companyId) {
    return NextResponse.json({ error: "Invalid company_id" }, { status: 403 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({
      checks: [],
      demo: true,
      message: "Database not configured",
    });
  }

  const { data: company, error: coErr } = await supabase
    .from("companies")
    .select("admin_email, domain")
    .eq("id", companyId)
    .maybeSingle();

  if (coErr || !company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const adminEmail = String(company.admin_email || session.email).toLowerCase();
  const domain = String(company.domain || "");

  const { data: members } = await supabase
    .from("company_users")
    .select("email")
    .eq("company_id", companyId)
    .order("email");

  const memberEmails = (members || []).map((m) => String(m.email));
  const planned = getTenantHandoffStaff(domain);
  const emails = buildChecklistEmails(adminEmail, memberEmails, planned);

  const checks = await evaluateGoLiveChecks(supabase, companyId, emails);

  return NextResponse.json({ companyId, checks });
}
