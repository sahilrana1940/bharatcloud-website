import { BRAND_PRODUCT } from "@/lib/brand";

function resendFailureIsDomainOrConfig(raw: string): boolean {
  const s = raw.toLowerCase();
  return (
    s.includes("domain is not verified") ||
    s.includes("validation_error") ||
    s.includes("not authorized to send") ||
    s.includes("invalid from")
  );
}

function friendlyResendError(raw: string): string {
  try {
    const j = JSON.parse(raw) as { message?: string };
    if (j.message) return j.message;
  } catch {
    /* plain text */
  }
  return raw.slice(0, 280);
}

export async function sendArchivedMailForward(opts: {
  companyFromEmail: string;
  to: string;
  requestedByEmail: string;
  originalSubject: string;
  originalFrom: string;
  originalDate: string;
  bodyText: string;
}): Promise<{ sent: boolean; demoQueued?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      sent: false,
      demoQueued: true,
      error: "RESEND_API_KEY not set — forward saved in BharatCloud log only (demo).",
    };
  }

  const from =
    process.env.COMPANY_MAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    `${BRAND_PRODUCT} <onboarding@resend.dev>`;

  const subject = `Fwd: ${opts.originalSubject}`;
  const text = [
    `Forwarded by ${opts.requestedByEmail} via ${BRAND_PRODUCT} archive.`,
    `Original date: ${opts.originalDate}`,
    `Original from: ${opts.originalFrom}`,
    "",
    "--- Archived message ---",
    opts.bodyText || "(no body text in archive)",
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      reply_to: opts.companyFromEmail,
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (resendFailureIsDomainOrConfig(body)) {
      return {
        sent: false,
        demoQueued: true,
        error: friendlyResendError(body),
      };
    }
    return { sent: false, error: friendlyResendError(body || res.statusText) };
  }
  return { sent: true };
}
