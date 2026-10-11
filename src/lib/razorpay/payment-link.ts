const RAZORPAY_API = "https://api.razorpay.com/v1";

export type WorkspacePlanId = "pro" | "business";

export const WORKSPACE_PLANS: Record<
  WorkspacePlanId,
  { amountPaise: number; label: string; planName: string }
> = {
  pro: {
    amountPaise: 199_900,
    label: "BharatCloud Pro (monthly)",
    planName: "pro",
  },
  business: {
    amountPaise: 499_900,
    label: "BharatCloud Business (monthly)",
    planName: "business",
  },
};

function basicAuth(): string | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) return null;
  return Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

export async function createRazorpayPaymentLink(opts: {
  amountPaise: number;
  description: string;
  customerEmail: string;
  notes: Record<string, string>;
  callbackUrl: string;
}): Promise<{ id: string; short_url: string }> {
  const auth = basicAuth();
  if (!auth) {
    throw new Error("Razorpay keys not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
  }

  const res = await fetch(`${RAZORPAY_API}/payment_links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: opts.amountPaise,
      currency: "INR",
      description: opts.description,
      customer: { email: opts.customerEmail },
      notify: { sms: false, email: true },
      reminder_enable: true,
      notes: opts.notes,
      callback_url: opts.callbackUrl,
      callback_method: "get",
    }),
  });

  const data = (await res.json()) as {
    id?: string;
    short_url?: string;
    error?: { description?: string; code?: string };
  };

  if (!res.ok || !data.short_url || !data.id) {
    const msg = data.error?.description || data.error?.code || "Razorpay payment link failed";
    throw new Error(msg);
  }

  return { id: data.id, short_url: data.short_url };
}
