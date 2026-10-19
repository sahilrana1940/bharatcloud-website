import { NextResponse } from "next/server";

import { isPlatformAdminSession } from "@/lib/admin/access";
import { getSessionRole } from "@/lib/auth";
import { readWorkspaceAuthRepaired } from "@/lib/billing/workspace-cookies";
import { attachWorkspaceCompanyCookie } from "@/lib/billing/workspace-cookies";
import { resolveArchiveCompanyId } from "@/lib/archive/resolve-archive-company";
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

  const companyId = await resolveArchiveCompanyId(
    supabase,
    session.companyId,
    session.email,
  );

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") || "mine";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") || 500)));
  const offset = (page - 1) * limit;

  const mapEb = (rows: Record<string, unknown>[]) =>
    rows.map((r) => ({
      id: r.id as string,
      file_name: (r.subject as string) || "email",
      subject: r.subject as string,
      from_email: r.from_email as string,
      snippet: (r.body_text as string) || "",
      message_date: (r.date as string) || (r.created_at as string),
      owner_email: r.owner_email as string,
      size: 0,
      saved_mb: Number(r.saved_mb || 0),
      view_count: Number(r.view_count || 0),
    }));

  const role = await getSessionRole();
  const isSuperAdmin = isPlatformAdminSession(role);

  const inbox = await supabase
    .from("user_inbox_view")
    .select(
      "id, user_email, is_read, team_emails(subject, from_email, snippet, created_at, saved_mb, message_id, team_id)",
    )
    .eq("user_email", session.email.toLowerCase())
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (!inbox.error && inbox.data?.length) {
    const items = inbox.data.map((row) => {
      const mail = Array.isArray(row.team_emails) ? row.team_emails[0] : row.team_emails;
      return {
        id: row.id as string,
        file_name: mail?.subject || "email",
        subject: mail?.subject || "",
        from_email: mail?.from_email || "",
        snippet: mail?.snippet || "",
        message_date: mail?.created_at || "",
        owner_email: row.user_email as string,
        size: 0,
        saved_mb: Number(mail?.saved_mb || 0),
        view_count: isSuperAdmin ? undefined : 0,
        message_id: mail?.message_id,
        team_id: mail?.team_id,
      };
    });
    if (isSuperAdmin) {
      const ids = items.map((item) => item.message_id).filter(Boolean);
      if (ids.length) {
        const counts = await supabase
          .from("user_inbox_view")
          .select("message_id")
          .in("message_id", ids as string[]);
        const tally = new Map<string, number>();
        for (const row of counts.data || []) {
          const id = row.message_id as string;
          tally.set(id, (tally.get(id) || 0) + 1);
        }
        for (const item of items) {
          item.view_count = tally.get(item.message_id || "") || 0;
        }
      }
    }
    return NextResponse.json({
      items,
      page,
      total: items.length,
      companyId,
      email: session.email,
      source: "user_inbox_view",
      isSuperAdmin,
    });
  }

  const cookieFix = companyId !== session.companyId || cookieRepaired;

  let ebQuery = supabase
    .from("email_backups")
    .select("id, subject, from_email, body_text, date, owner_email", { count: "exact" })
    .eq("company_id", companyId)
    .order("date", { ascending: false });
  if (scope !== "company") {
    ebQuery = ebQuery.eq("owner_email", session.email.toLowerCase());
  }
  const ebFirst = await ebQuery.range(offset, offset + limit - 1);
  if (!ebFirst.error && ebFirst.data?.length) {
    const res = NextResponse.json({
      items: mapEb(ebFirst.data),
      page,
      total: ebFirst.count || ebFirst.data.length,
      companyId,
      email: session.email,
      source: "email_backups",
    });
    if (cookieFix) attachWorkspaceCompanyCookie(res, companyId);
    return res;
  }

  if (!ebFirst.error && (ebFirst.count ?? 0) > 0 && !ebFirst.data?.length) {
    const ebRelaxed = await supabase
      .from("email_backups")
      .select("id, subject, from_email, body_text, date, owner_email", { count: "exact" })
      .eq("company_id", companyId)
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);
    if (ebRelaxed.data?.length) {
      const res = NextResponse.json({
        items: mapEb(ebRelaxed.data),
        page,
        total: ebRelaxed.count || ebRelaxed.data.length,
        companyId,
        email: session.email,
        source: "email_backups",
      });
      if (cookieFix) attachWorkspaceCompanyCookie(res, companyId);
      return res;
    }
  }

  let query = supabase
    .from("archive_files")
    .select(
      "id, file_name, size, storage_path, subject, from_email, message_date, owner_email, gmail_id, created_at",
      { count: "exact" },
    )
    .eq("company_id", companyId)
    .eq("type", "email")
    .order("message_date", { ascending: false, nullsFirst: false });

  if (scope !== "company") {
    query = query.eq("owner_email", session.email.toLowerCase());
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error?.message.includes("archive_files")) {
    const fallback = await supabase
      .from("email_backups")
      .select("id, subject, from_email, body_text, date, owner_email", { count: "exact" })
      .eq("company_id", companyId)
      .eq("owner_email", session.email.toLowerCase())
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);
    const res = NextResponse.json({
      items: mapEb(fallback.data || []),
      page,
      total: fallback.count || 0,
      migrationRequired: true,
    });
    if (companyId !== session.companyId || cookieRepaired) {
      attachWorkspaceCompanyCookie(res, companyId);
    }
    return res;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data?.length && (count === 0 || count === null)) {
    const fallback = await supabase
      .from("email_backups")
      .select("id, subject, from_email, body_text, date, owner_email", { count: "exact" })
      .eq("company_id", companyId)
      .eq("owner_email", session.email.toLowerCase())
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);
    if (fallback.data?.length) {
      const res = NextResponse.json({
        items: mapEb(fallback.data),
        page,
        total: fallback.count || 0,
        companyId,
        email: session.email,
        source: "email_backups",
      });
      if (companyId !== session.companyId || cookieRepaired) {
        attachWorkspaceCompanyCookie(res, companyId);
      }
      return res;
    }
  }

  const res = NextResponse.json({
    items: data || [],
    page,
    total: count || 0,
    companyId,
    email: session.email,
  });
  if (companyId !== session.companyId || cookieRepaired) {
    attachWorkspaceCompanyCookie(res, companyId);
  }
  return res;
}
