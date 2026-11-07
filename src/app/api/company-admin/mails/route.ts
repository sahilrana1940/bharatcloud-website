import { NextResponse } from "next/server";

import {
  MAIL_ARCHIVE_YEARS,
  mailArchiveWindowStart,
} from "@/lib/email/company-mail-key";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

function safeTerm(raw: string): string {
  return raw.replace(/[%_*,.()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function istDay(date: string): { start: string; end: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const start = new Date(`${date}T00:00:00+05:30`);
  if (Number.isNaN(start.getTime())) return null;
  return {
    start: start.toISOString(),
    end: new Date(start.getTime() + 86_400_000).toISOString(),
  };
}

function like(column: string, term: string): string {
  const value = /\s/.test(term) ? `"%${term}%"` : `%${term}%`;
  return `${column}.ilike.${value}`;
}

function searchOr(email: string, word: string): string | null {
  const emailMatch = email
    ? [like("from_email", email), like("to_email", email), like("company_from_email", email)]
    : [];
  const wordMatch = word ? [like("subject", word), like("body_text", word)] : [];
  if (emailMatch.length && wordMatch.length) {
    const pairs: string[] = [];
    for (const left of emailMatch) {
      for (const right of wordMatch) pairs.push(`and(${left},${right})`);
    }
    return pairs.join(",");
  }
  if (emailMatch.length) return emailMatch.join(",");
  if (wordMatch.length) return wordMatch.join(",");
  return null;
}

/** Admin-only company archive search. Employees receive 403. */
export async function GET(req: Request) {
  const auth = await requireWorkspace(true);
  if (auth instanceof NextResponse) return auth;
  const { session, tenant } = auth;

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    return NextResponse.json({ mails: [], demo: true });
  }

  const url = new URL(req.url);
  const email = safeTerm(url.searchParams.get("email") || "");
  const word = safeTerm(url.searchParams.get("word") || "");
  const date = (url.searchParams.get("date") || "").trim();
  const windowStart = mailArchiveWindowStart();

  let rangeStart = windowStart.toISOString();
  let rangeEnd = "";
  if (date) {
    const day = istDay(date);
    if (!day) {
      return NextResponse.json({ error: "Use a date as YYYY-MM-DD" }, { status: 400 });
    }
    if (new Date(day.end) <= windowStart) {
      return NextResponse.json(
        { error: `Search covers the last ${MAIL_ARCHIVE_YEARS} years only` },
        { status: 400 },
      );
    }
    rangeStart = new Date(Math.max(windowStart.getTime(), new Date(day.start).getTime())).toISOString();
    rangeEnd = day.end;
  }

  let query = supabase
    .from("mails")
    .select(
      "id, subject, from_email, to_email, company_from_email, received_at, body_text",
    )
    .eq("company_id", session.companyId)
    .gte("received_at", rangeStart)
    .order("received_at", { ascending: false })
    .limit(40);

  if (rangeEnd) query = query.lt("received_at", rangeEnd);

  const orFilter = searchOr(email, word);
  if (orFilter) query = query.or(orFilter);

  const { data, error } = await query;
  if (error) {
    if (/mails|schema cache|does not exist/i.test(error.message)) {
      return NextResponse.json({
        mails: [],
        migrationRequired: true,
        windowStart: windowStart.toISOString(),
        domain: tenant?.company.domain || "",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    mails: (data || []).map((row) => ({
      id: row.id,
      subject: row.subject || "(no subject)",
      from_email: row.from_email || "",
      to_email: row.to_email || "",
      company_from_email: row.company_from_email || "",
      received_at: row.received_at,
      snippet: String(row.body_text || "").slice(0, 400),
    })),
    windowStart: windowStart.toISOString(),
    domain: tenant?.company.domain || "",
  });
}
