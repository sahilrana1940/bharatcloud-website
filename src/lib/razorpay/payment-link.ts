import { BILLING_PLANS, type BillingPlanId } from "@/lib/billing/plans";

const RAZORPAY_API = "https://api.razorpay.com/v1";

export type WorkspacePlanId = BillingPlanId | "pro";

export const WORKSPACE_PLANS: Record<
  WorkspacePlanId,
  { amountPaise: number; label: string; planName: string }
> = {
  starter: {
    amountPaise: 599_900,
    label: "BharatCloud STARTER",
    planName: "starter",
  },
  growth: {
    amountPaise: 1_299_900,
    label: "BharatCloud GROWTH",
    planName: "growth",
  },
  scale: {
    amountPaise: 1_499_900,
    label: "BharatCloud SCALE",
    planName: "scale",
  },
  standard: {
    amountPaise: 1_299_900,
    label: "BharatCloud GROWTH",
    planName: "growth",
  },
  business: {
    amountPaise: 1_499_900,
    label: "BharatCloud SCALE",
    planName: "scale",
  },
  pro: {
    amountPaise: 99_900,
    label: "BharatCloud Starter (legacy pro alias)",
    planName: "starter",
  },
};

for (const p of BILLING_PLANS) {
  WORKSPACE_PLANS[p.id] = {
    amountPaise: p.price * 100,
    label: `BharatCloud ${p.name} (monthly)`,
    planName: p.id,
  };
}

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
