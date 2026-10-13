import { BRAND_PRODUCT } from "@/lib/brand";

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
    `${BRAND_PRODUCT} <${opts.companyFromEmail}>`;

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
    return { sent: false, error: body || res.statusText };
  }
  return { sent: true };
}
