import { BRAND_PARENT, BRAND_PRODUCT } from "@/lib/brand";

export async function sendRecoveryCodeEmail(
  to: string,
  code: string,
  userEmail: string,
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY not set" };
  }

  const from =
    process.env.RECOVERY_FROM_EMAIL?.trim() ||
    `${BRAND_PARENT} <onboarding@resend.dev>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${BRAND_PRODUCT} account recovery code`,
      text: `Your recovery code for ${userEmail}:\n\n${code}\n\nValid for 1 hour. Enter at https://www.bharattijori.com/recover/verify\n\n— ${BRAND_PARENT}`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { sent: false, error: body || res.statusText };
  }
  return { sent: true };
}
