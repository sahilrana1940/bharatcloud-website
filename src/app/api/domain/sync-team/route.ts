import { NextResponse } from "next/server";

import { loadTenantCompany } from "@/lib/tenant";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { listDiscoveredEmails } from "@/lib/workspace/company-directory";

/** Owner: refresh @domain team list from directory + DB (no manual invite). */
export async function POST() {
  const auth = await requireWorkspace(true);
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const company = await loadTenantCompany(session.companyId);
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const emails = await listDiscoveredEmails(session.companyId, company.domain);
  return NextResponse.json({ ok: true, count: emails.length, emails });
}
