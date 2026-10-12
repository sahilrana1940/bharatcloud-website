import { NextResponse } from "next/server";

import { readWorkspaceAuthRepaired } from "@/lib/billing/workspace-cookies";
import { attachWorkspaceCompanyCookie } from "@/lib/billing/workspace-cookies";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

/** Central company email archive list (service role — no RLS). */
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
    return NextResponse.json({ items: [], demo: true });
  }

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") || "mine";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = 40;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("archive_files")
    .select(
      "id, file_name, size, storage_path, subject, from_email, message_date, owner_email, gmail_id, created_at",
      { count: "exact" },
    )
    .eq("company_id", session.companyId)
    .eq("type", "email")
    .order("message_date", { ascending: false, nullsFirst: false });

  if (scope !== "company") {
    query = query.eq("owner_email", session.email.toLowerCase());
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    if (error.message.includes("archive_files")) {
      const fallback = await supabase
        .from("email_backups")
        .select("*", { count: "exact" })
        .eq("company_id", session.companyId)
        .eq("owner_email", session.email.toLowerCase())
        .order("date", { ascending: false })
        .range(offset, offset + limit - 1);
      const items = (fallback.data || []).map((r) => ({
        id: r.id,
        file_name: r.subject || "email",
        subject: r.subject,
        from_email: r.from_email,
        message_date: r.date,
        owner_email: r.owner_email,
        size: 0,
      }));
      const res = NextResponse.json({
        items,
        page,
        total: fallback.count || 0,
        migrationRequired: true,
      });
      if (cookieRepaired) attachWorkspaceCompanyCookie(res, session.companyId);
      return res;
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const res = NextResponse.json({
    items: data || [],
    page,
    total: count || 0,
    companyId: session.companyId,
    email: session.email,
  });
  if (cookieRepaired) attachWorkspaceCompanyCookie(res, session.companyId);
  return res;
}
