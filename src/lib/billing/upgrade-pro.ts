/** Opens Razorpay payment link, or UPI billing page when live Razorpay is off. */
export async function openUpgradePaymentLink(opts?: {
  companyEmail?: string;
  plan?: "pro" | "business";
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const cfgRes = await fetch("/api/billing/config");
  const cfg = await cfgRes.json().catch(() => ({}));
  if (cfg.simulateUpiFlow) {
    window.location.href = "/dashboard/billing";
    return { ok: true };
  }

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
  if ((data.bypass || data.useBillingPage) && data.redirect) {
    window.location.href = data.redirect;
    return { ok: true };
  }
  if (!data.url) {
    if (data.redirect) {
      window.location.href = data.redirect;
      return { ok: true };
    }
    return { ok: false, error: "No payment URL returned" };
  }
  window.open(data.url, "_blank", "noopener,noreferrer");
  return { ok: true };
}
