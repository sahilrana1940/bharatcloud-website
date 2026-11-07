import { NextResponse } from "next/server";

import { resolveArchiveCompanyId } from "@/lib/archive/resolve-archive-company";
import { loadArchivedEmailForForward } from "@/lib/email/load-archived-body";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import { isOrgUser } from "@/lib/workspace/org-user";
import { isWorkspaceOwner } from "@/lib/workspace/nav";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** GET — single archived email (body withheld for org_user → forward only). */
export async function GET(_req: Request, context: RouteContext) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const { id } = await context.params;
  const emailId = String(id || "").trim();
  if (!emailId) {
    return NextResponse.json({ error: "Missing email id" }, { status: 400 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const companyId = await resolveArchiveCompanyId(
    supabase,
    session.companyId,
    session.email,
  );

  const row = await loadArchivedEmailForForward(supabase, emailId, companyId);
  if (!row) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  const owner = String(row.owner_email || "").toLowerCase();
  const me = session.email.toLowerCase();
  const adminView = isWorkspaceOwner({
    role: session.role,
    saasRole: session.saasRole,
    isCompanyOwner: session.isCompanyOwner,
  });

  if (!adminView && owner && owner !== me) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isOrgUser(session)) {
    return NextResponse.json(
      {
        error: "require_forward",
        require_forward: true,
        id: row.id,
        subject: row.subject,
        from_email: row.from_email,
        date: row.date,
      },
      { status: 403 },
    );
  }

  return NextResponse.json({
    id: row.id,
    subject: row.subject,
    from_email: row.from_email,
    date: row.date,
    body_text: row.body_text,
    owner_email: row.owner_email,
  });
}
