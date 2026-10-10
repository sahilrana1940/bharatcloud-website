import { NextResponse } from "next/server";

import { requireWorkspace } from "@/lib/workspace/auth-api";
import { resolveCompanyDomain } from "@/lib/workspace/company";
import { DEMO_EMAILS } from "@/lib/workspace/demo-data";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = 50;
  const offset = (page - 1) * limit;

  const supabase = await getSupabaseOrNull();
  const domain = await resolveCompanyDomain(session.companyId, session.email);

  if (!supabase) {
    let rows = [...DEMO_EMAILS];
    if (session.role === "member") rows = rows.filter((e) => e.owner_email === session.email);
    if (q) {
      const l = q.toLowerCase();
      rows = rows.filter(
        (e) =>
          e.subject?.toLowerCase().includes(l) ||
          e.from_email?.toLowerCase().includes(l) ||
          e.body_text?.toLowerCase().includes(l),
      );
    }
    return NextResponse.json({ emails: rows.slice(offset, offset + limit), page, total: rows.length });
  }

  let query = supabase
    .from("email_backups")
    .select("*", { count: "exact" })
    .eq("company_id", session.companyId);
  if (domain) query = query.eq("company_domain", domain);
  if (session.role === "member") query = query.eq("owner_email", session.email);
  if (q) {
    query = query.or(
      `subject.ilike.%${q}%,from_email.ilike.%${q}%,body_text.ilike.%${q}%`,
    );
  }
  const { data, count } = await query
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  return NextResponse.json({ emails: data || [], page, total: count || 0 });
}
