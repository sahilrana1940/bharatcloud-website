import { createHash } from "crypto";

const ADDRESS = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

/** Search includes the calendar year three years back, so 2023 mail is still found in 2026. */
export const MAIL_ARCHIVE_YEARS = 3;

export function mailArchiveWindowStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear() - MAIL_ARCHIVE_YEARS, 0, 1));
}

export function headerMap(
  headers:
    | Record<string, string | undefined>
    | Array<{ name?: string | null; value?: string | null }>
    | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  if (Array.isArray(headers)) {
    for (const header of headers) {
      const name = String(header.name || "").trim().toLowerCase();
      const value = String(header.value || "").trim();
      if (!name || !value || out[name]) continue;
      out[name] = value;
    }
    return out;
  }
  for (const [key, value] of Object.entries(headers)) {
    const name = key.trim().toLowerCase();
    const text = String(value || "").trim();
    if (!name || !text || out[name]) continue;
    out[name] = text;
  }
  return out;
}

export function parseRawMail(raw: string): { headers: Record<string, string>; body: string } {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const splitAt = text.search(/\n\n/);
  const head = splitAt >= 0 ? text.slice(0, splitAt) : text;
  const body = splitAt >= 0 ? text.slice(splitAt + 2) : "";
  const unfolded = head.replace(/\n[ \t]+/g, " ");
  const headers: Record<string, string> = {};
  for (const line of unfolded.split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const name = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (!name || !value || headers[name]) continue;
    headers[name] = value;
  }
  return { headers, body };
}

export function addressesIn(value: string): string[] {
  return Array.from(value.match(ADDRESS) || []).map((email) => email.toLowerCase());
}

export function firstAddress(value: string): string {
  return addressesIn(value)[0] || "";
}

function messageIdOf(value: string): string {
  const match = value.match(/<[^<>\s]+>/);
  return (match ? match[0] : value).trim().toLowerCase();
}

function stripReplyPrefix(subject: string): string {
  return subject.replace(/^(\s*(fwd|fw|re)\s*:\s*)+/i, "").trim();
}

const FORWARD_MARKERS = [
  "---------- forwarded message ---------",
  "-------- original message --------",
  "begin forwarded message:",
];

function forwardedSection(body: string): string {
  const lower = body.toLowerCase();
  let at = -1;
  for (const marker of FORWARD_MARKERS) {
    const found = lower.indexOf(marker);
    if (found >= 0 && (at < 0 || found < at)) at = found;
  }
  return at >= 0 ? body.slice(at) : "";
}

function innerHeaders(body: string): Record<string, string> {
  const section = forwardedSection(body);
  if (!section) return {};
  const afterMarker = section.replace(/^[^\n]*\n/, "");
  const head = (afterMarker.split(/\n\s*\n/)[0] || afterMarker).slice(0, 4000);
  return headerMap(
    head
      .split("\n")
      .map((line) => {
        const idx = line.indexOf(":");
        if (idx <= 0) return null;
        return { name: line.slice(0, idx), value: line.slice(idx + 1) };
      })
      .filter((row): row is { name: string; value: string } => Boolean(row?.name)),
  );
}

function innerBody(body: string): string {
  const section = forwardedSection(body);
  if (!section) return body;
  const afterMarker = section.replace(/^[^\n]*\n/, "");
  const parts = afterMarker.split(/\n\s*\n/);
  return parts.slice(1).join("\n\n") || parts[0] || body;
}

function normalizedText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase().slice(0, 500);
}

export type CompanyMailIdentity = {
  dedupeKey: string;
  contentKey: string | null;
  rfcMessageId: string;
  subject: string;
  fromEmail: string;
  toEmail: string;
  bodyText: string;
  receivedAt: string;
  companyFromEmail: string;
  isCompanyMail: boolean;
};

function onDomain(email: string, domain: string): boolean {
  return email.endsWith(`@${domain}`);
}

export function identifyCompanyMail(opts: {
  headers: Record<string, string>;
  body: string;
  mailboxEmail: string;
  companyDomain: string;
  adminEmail?: string;
  receivedAtFallback?: string | null;
}): CompanyMailIdentity {
  const domain = opts.companyDomain.trim().toLowerCase();
  const mailbox = opts.mailboxEmail.trim().toLowerCase();
  const inner = innerHeaders(opts.body);
  const subject = stripReplyPrefix(
    inner.subject || opts.headers.subject || "(no subject)",
  );
  const fromEmail = firstAddress(inner.from || opts.headers.from || "");
  const toEmail = firstAddress(inner.to || opts.headers.to || opts.headers.cc || "");
  const bodyText = normalizedText(innerBody(opts.body)) || subject.toLowerCase();
  const rfcMessageId = messageIdOf(
    inner["message-id"] ||
      opts.headers["x-original-message-id"] ||
      opts.headers["x-google-original-message-id"] ||
      opts.headers["message-id"] ||
      "",
  );

  const mentioned = addressesIn(
    [
      opts.headers["delivered-to"],
      opts.headers["x-original-to"],
      opts.headers.to,
      opts.headers.cc,
      opts.headers["envelope-to"],
      opts.headers["x-forwarded-to"],
      opts.headers["x-forwarded-for"],
      inner.to,
      inner.cc,
      forwardedSection(opts.body).slice(0, 4000),
    ]
      .filter(Boolean)
      .join(" "),
  ).filter((email) => onDomain(email, domain));
  const mailboxOnDomain = onDomain(mailbox, domain);
  const admin = (opts.adminEmail || "").trim().toLowerCase();
  const companyFromEmail =
    mentioned[0] ||
    (mailboxOnDomain ? mailbox : "") ||
    (onDomain(admin, domain) ? admin : "") ||
    (domain ? `support@${domain}` : mailbox);
  const isCompanyMail = mailboxOnDomain || mentioned.length > 0;

  const daySource = inner.date || opts.headers.date || opts.receivedAtFallback || "";
  const parsed = daySource ? new Date(daySource) : null;
  const receivedAt =
    parsed && !Number.isNaN(parsed.getTime())
      ? parsed.toISOString()
      : opts.receivedAtFallback && !Number.isNaN(new Date(opts.receivedAtFallback).getTime())
        ? new Date(opts.receivedAtFallback).toISOString()
        : new Date().toISOString();
  const day = receivedAt.slice(0, 10);
  const contentMaterial = `${fromEmail}|${subject.toLowerCase()}|${day}|${bodyText}`;
  const contentKey =
    bodyText.length >= 12 || subject.length >= 3
      ? createHash("sha256").update(contentMaterial).digest("hex")
      : null;

  const dedupeKey = rfcMessageId
    ? `mid:${rfcMessageId}`
    : `fp:${contentKey || createHash("sha256").update(contentMaterial).digest("hex")}`;

  return {
    dedupeKey,
    contentKey,
    rfcMessageId,
    subject: subject.slice(0, 500),
    fromEmail,
    toEmail,
    bodyText: (innerBody(opts.body) || opts.body || subject).replace(/\s+/g, " ").trim().slice(0, 100000),
    receivedAt,
    companyFromEmail,
    isCompanyMail: Boolean(domain) && isCompanyMail,
  };
}

export function sameCompanyDomain(email: string, domain: string): boolean {
  const host = email.trim().toLowerCase().split("@")[1] || "";
  return Boolean(host) && host === domain.trim().toLowerCase();
}
