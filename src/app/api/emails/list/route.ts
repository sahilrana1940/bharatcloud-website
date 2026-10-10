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
  const owner = url.searchParams.get("owner") || "";
  const hasAttachment = url.searchParams.get("attachment") === "1";
  const range = url.searchParams.get("range") || "";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = 50;
  const offset = (page - 1) * limit;

  const domain = await resolveCompanyDomain(session.companyId, session.email);
  const supabase = await getSupabaseOrNull();
  let rows = [...DEMO_EMAILS];
  if (supabase) {
    let query = supabase
      .from("email_backups")
      .select("*", { count: "exact" })
      .eq("company_id", session.companyId);
    if (domain) query = query.eq("company_domain", domain);
    const companyWide =
      session.saasRole === "company_owner" || session.saasRole === "employee";
    if (!companyWide && session.role === "member") {
      query = query.eq("owner_email", session.email);
    } else if (owner) {
      query = query.eq("owner_email", owner);
    }
    if (hasAttachment) query = query.eq("has_attachment", true);
    if (q) {
      query = query.or(
        `subject.ilike.%${q}%,from_email.ilike.%${q}%,body_text.ilike.%${q}%`,
      );
    }
    const { data, count } = await query
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);
    return NextResponse.json({
      emails: data || [],
      page,
      total: count || 0,
    });
  } else {
    rows = rows.filter(
      (e) => (e as { company_domain?: string }).company_domain === domain || !domain,
    );
    const companyWide =
      session.saasRole === "company_owner" || session.saasRole === "employee";
    if (!companyWide && session.role === "member") {
      rows = rows.filter((e) => e.owner_email === session.email);
    } else if (owner) {
      rows = rows.filter((e) => e.owner_email === owner);
    }
    if (q) {
      const l = q.toLowerCase();
      rows = rows.filter(
        (e) =>
          e.subject?.toLowerCase().includes(l) ||
          e.from_email?.toLowerCase().includes(l) ||
          e.body_text?.toLowerCase().includes(l),
      );
    }
  }

  if (range && !supabase) {
    const now = Date.now();
    const day = 86400000;
    rows = rows.filter((e) => {
      const t = new Date(e.date).getTime();
      if (range === "today") return now - t < day;
      if (range === "yesterday") return now - t < 2 * day && now - t >= day;
      if (range === "7d") return now - t < 7 * day;
      return true;
    });
  }

  const total = rows.length;
  return NextResponse.json({ emails: rows.slice(offset, offset + limit), page, total });
}
