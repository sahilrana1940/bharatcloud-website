import type { SupabaseClient } from "@supabase/supabase-js";

import { headerMap, identifyCompanyMail, parseRawMail } from "@/lib/email/company-mail-key";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const companyCache = new Map<string, { domain: string; adminEmail: string }>();

function missingMailsTable(message: string): boolean {
  return /mails|schema cache|does not exist|could not find the table/i.test(message);
}

function isDuplicate(message: string): boolean {
  return /duplicate key|unique constraint|23505/i.test(message);
}

async function companyIdentity(
  supabase: SupabaseClient,
  companyId: string,
  fallbackDomain?: string,
): Promise<{ domain: string; adminEmail: string }> {
  const cached = companyCache.get(companyId);
  if (cached) return cached;
  const { data } = await supabase
    .from("companies")
    .select("domain, admin_email")
    .eq("id", companyId)
    .maybeSingle();
  const identity = {
    domain: String(data?.domain || fallbackDomain || "").toLowerCase(),
    adminEmail: String(data?.admin_email || "").toLowerCase(),
  };
  if (identity.domain) companyCache.set(companyId, identity);
  return identity;
}

/**
 * Insert one mails row for a company message.
 * A later copy (another personal Gmail forward of the same mail) does not insert again.
 */
export async function saveCompanyMailOnce(opts: {
  companyId: string;
  mailboxEmail: string;
  headers?:
    | Record<string, string | undefined>
    | Array<{ name?: string | null; value?: string | null }>;
  bodyText?: string;
  raw?: string | Buffer;
  storagePath?: string | null;
  companyDomain?: string;
  receivedAt?: string | null;
}): Promise<{ ok: true; duplicate: boolean; skipped?: boolean } | { ok: false; error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: false, error: "Supabase is not configured" };

  let headers = headerMap(opts.headers);
  let body = opts.bodyText || "";
  if (opts.raw) {
    const text =
      typeof opts.raw === "string"
        ? opts.raw.slice(0, 200_000)
        : opts.raw.subarray(0, 200_000).toString("utf8");
    const parsed = parseRawMail(text);
    headers = { ...parsed.headers, ...headers };
    if (!body) body = parsed.body;
  }

  const company = await companyIdentity(supabase, opts.companyId, opts.companyDomain);
  const mail = identifyCompanyMail({
    headers,
    body,
    mailboxEmail: opts.mailboxEmail,
    companyDomain: company.domain,
    adminEmail: company.adminEmail,
    receivedAtFallback: opts.receivedAt,
  });
  if (!mail.isCompanyMail) return { ok: true, duplicate: false, skipped: true };

  const existing = await supabase
    .from("mails")
    .select("id")
    .eq("company_id", opts.companyId)
    .eq("dedupe_key", mail.dedupeKey)
    .maybeSingle();
  if (existing.error) {
    if (missingMailsTable(existing.error.message)) {
      return { ok: true, duplicate: false, skipped: true };
    }
    return { ok: false, error: existing.error.message };
  }
  if (existing.data?.id) return { ok: true, duplicate: true };

  if (mail.contentKey) {
    const byContent = await supabase
      .from("mails")
      .select("id")
      .eq("company_id", opts.companyId)
      .eq("content_key", mail.contentKey)
      .maybeSingle();
    if (byContent.data?.id) return { ok: true, duplicate: true };
    if (byContent.error && missingMailsTable(byContent.error.message)) {
      return { ok: true, duplicate: false, skipped: true };
    }
  }

  const { error } = await supabase.from("mails").insert({
    company_id: opts.companyId,
    company_domain: company.domain,
    dedupe_key: mail.dedupeKey,
    content_key: mail.contentKey,
    rfc_message_id: mail.rfcMessageId || null,
    subject: mail.subject,
    from_email: mail.fromEmail || null,
    to_email: mail.toEmail || null,
    body_text: mail.bodyText,
    received_at: mail.receivedAt,
    company_from_email: mail.companyFromEmail,
    storage_path: opts.storagePath || null,
  });
  if (!error) return { ok: true, duplicate: false };
  if (isDuplicate(error.message) || missingMailsTable(error.message)) {
    return { ok: true, duplicate: isDuplicate(error.message), skipped: missingMailsTable(error.message) };
  }
  console.error("[mails] insert", error.message);
  return { ok: false, error: error.message };
}

/** Drop the employee's inbox pointer only. Company mails stay. */
export async function removeEmployeeKeepMails(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ ok: true; mailsRetained: true } | { ok: false; error: string }> {
  const { data, error: readError } = await supabase
    .from("company_users")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  if (readError) return { ok: false, error: readError.message };

  const email = String(data?.email || "").toLowerCase();
  if (email) {
    const pointer = await supabase.from("user_inbox_view").delete().eq("user_email", email);
    if (pointer.error && !/user_inbox_view|schema cache|does not exist/i.test(pointer.error.message)) {
      return { ok: false, error: pointer.error.message };
    }
  }

  const { error } = await supabase.from("company_users").delete().eq("id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, mailsRetained: true };
}
