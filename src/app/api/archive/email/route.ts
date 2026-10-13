import { NextResponse } from "next/server";

import {
  getEmailArchiveStatus,
  runEmailArchiveForUser,
} from "@/lib/archive/run-email-archive";
import {
  attachWorkspaceCompanyCookie,
  readWorkspaceAuthRepaired,
} from "@/lib/billing/workspace-cookies";
import { resolveCompanyDomain } from "@/lib/workspace/company";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";
import {
  fetchGoogleTokenRowForWorkspace,
  isGoogleTokenRowConnected,
} from "@/lib/google/token-row";

export const maxDuration = 300;

async function sessionContext() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;

  const repaired = await readWorkspaceAuthRepaired();
  if (!repaired) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { auth: ws, repaired: cookieRepaired } = repaired;
  const domain = await resolveCompanyDomain(ws.companyId, ws.email);

  return { supabase, session: ws, domain, cookieRepaired };
}

/** GET — Gmail archive job status for logged-in user (no billing gate). */
export async function GET() {
  const ctx = await sessionContext();
  if (ctx instanceof NextResponse) return ctx;

  const { supabase, session, cookieRepaired } = ctx;
  const tokenRow = await fetchGoogleTokenRowForWorkspace(
    supabase,
    session.companyId,
    session.email,
  );
  const googleConnected = isGoogleTokenRowConnected(tokenRow);

  const status = await getEmailArchiveStatus(
    supabase,
    session.companyId,
    session.email,
  );

  const res = NextResponse.json({
    ...status,
    googleConnected,
    companyId: session.companyId,
    email: session.email,
  });
  if (cookieRepaired) attachWorkspaceCompanyCookie(res, session.companyId);
  return res;
}

/** POST — start Gmail archiving for logged-in employee (no billing check). */
export async function POST() {
  const ctx = await sessionContext();
  if (ctx instanceof NextResponse) return ctx;

  const { supabase, session, domain, cookieRepaired } = ctx;

  const result = await runEmailArchiveForUser(supabase, {
    companyId: session.companyId,
    email: session.email,
    domain,
  });

  const res = NextResponse.json(
    result.success
      ? { success: true, count: result.count, status: result.status, progress: result.progress }
      : { success: false, error: result.error, status: result.status },
    { status: result.success ? 200 : 400 },
  );
  if (cookieRepaired) attachWorkspaceCompanyCookie(res, session.companyId);
  return res;
}
