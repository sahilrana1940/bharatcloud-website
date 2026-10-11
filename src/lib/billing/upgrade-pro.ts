/** Opens Razorpay payment link for workspace Pro / Business. */
export async function openUpgradePaymentLink(opts?: {
  companyEmail?: string;
  plan?: "pro" | "business";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/create-payment-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_email: opts?.companyEmail,
      plan: opts?.plan || "pro",
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, error: data.error || "Could not create payment link" };
  }
  if (!data.url) {
    return { ok: false, error: "No payment URL returned" };
  }
  window.open(data.url, "_blank", "noopener,noreferrer");
  return { ok: true };
}
