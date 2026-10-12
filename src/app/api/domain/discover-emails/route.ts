import { NextResponse } from "next/server";
import { promises as dns } from "dns";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { listDiscoveredEmails, normalizeDomain } from "@/lib/workspace/company-directory";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isWorkspaceOwner } from "@/lib/workspace/nav";
import { loadTenantCompany } from "@/lib/tenant";

export async function GET() {
  const auth = await requireWorkspace(true);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const company = await loadTenantCompany(session.companyId);
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const domain = normalizeDomain(company.domain);
  const emails = await listDiscoveredEmails(session.companyId, domain);

  let mxHosts: string[] = [];
  try {
    const mx = await dns.resolveMx(domain);
    mxHosts = mx.map((r) => r.exchange).slice(0, 5);
  } catch {
    mxHosts = [];
  }

  const supabase = await getSupabaseOrNull();
  let godaddyConnected = false;
  if (supabase) {
    const { data } = await supabase
      .from("companies")
      .select("godaddy_connected")
      .eq("id", session.companyId)
      .maybeSingle();
    godaddyConnected = Boolean(data?.godaddy_connected);
  }

  return NextResponse.json({
    domain,
    emails,
    mxHosts,
    integrations: {
      googleWorkspaceDirectory: "Connect Google in Settings to enable directory sync (coming soon)",
      goDaddy: godaddyConnected
        ? "connected"
        : "placeholder — set godaddy_connected when API keys are added",
    },
  });
}

export async function POST(req: Request) {
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

  const body = await req.json().catch(() => ({}));
  const domain = normalizeDomain(String(body.domain || ""));
  const addEmail = String(body.addEmail || "").trim().toLowerCase();

  if (!domain || !domain.includes(".")) {
    return NextResponse.json({ error: "Valid domain required" }, { status: 400 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { error: upErr } = await supabase
    .from("companies")
    .update({ domain })
    .eq("id", session.companyId);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  if (addEmail && addEmail.includes("@")) {
    await supabase.from("company_directory_emails").upsert(
      {
        company_id: session.companyId,
        email: addEmail,
        source: "manual",
        backup_enabled: true,
      },
      { onConflict: "company_id,email" },
    );
  }

  const emails = await listDiscoveredEmails(session.companyId, domain);
  return NextResponse.json({ ok: true, domain, emails });
}
