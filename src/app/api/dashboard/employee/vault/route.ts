import { NextResponse } from "next/server";

import {
  attachWorkspaceCompanyCookie,
  readWorkspaceAuthRepaired,
} from "@/lib/billing/workspace-cookies";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

/** Employee vault index: central archive_files for company (service role). */
export async function GET(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;

  const repaired = await readWorkspaceAuthRepaired();
  if (!repaired) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { auth: session, repaired: cookieRepaired } = repaired;
  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ items: [] });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "email";

  const { data, error } = await supabase
    .from("archive_files")
    .select("id, type, file_name, size, owner_email, storage_path, created_at")
    .eq("company_id", session.companyId)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error?.message.includes("archive_files")) {
    const res = NextResponse.json({ items: [], migrationRequired: true });
    if (cookieRepaired) attachWorkspaceCompanyCookie(res, session.companyId);
    return res;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const res = NextResponse.json({
    items: data || [],
    companyId: session.companyId,
    centralVault: true,
  });
  if (cookieRepaired) attachWorkspaceCompanyCookie(res, session.companyId);
  return res;
}
