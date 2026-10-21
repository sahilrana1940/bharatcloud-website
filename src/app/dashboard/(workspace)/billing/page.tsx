"use client";

import { useMemo, useState } from "react";

import { BILLING_PLANS, type BillingPlanId } from "@/lib/billing/plans";

const UPI_ID = "sahilrana1940@pytes";
const PAYEE = "BharatCloud";

export default function BillingPage() {
  const [selectedId, setSelectedId] = useState<BillingPlanId>("growth");
  const selected = BILLING_PLANS.find((plan) => plan.id === selectedId) ?? BILLING_PLANS[1];

  const upiLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: UPI_ID,
      pn: PAYEE,
      am: String(selected.price),
      cu: "INR",
      tn: `BharatCloud ${selected.name}`,
    });
    return `upi://pay?${params.toString()}`;
  }, [selected.name, selected.price]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(upiLink)}`;

  return (
    <div className="px-4 py-8 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F766E]">UPI only</p>
      <h1 className="mt-2 text-2xl font-semibold text-[#10243E] sm:text-3xl">Billing</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-600">
        Pay with any UPI app. Scan the QR or pay <strong>{UPI_ID}</strong>. Cards and netbanking are not accepted.
      </p>

      <div className="mt-8 grid max-w-4xl gap-3 sm:grid-cols-3">
        {BILLING_PLANS.map((plan) => {
          const on = plan.id === selected.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedId(plan.id)}
              className={`rounded-2xl border p-4 text-left ${
                on ? "border-[#00BAF2] bg-white ring-2 ring-[#00BAF2]" : "border-slate-200 bg-white"
              }`}
            >
              {plan.tag ? (
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#0F766E]">{plan.tag}</span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wide text-transparent">.</span>
              )}
              <p className="text-lg font-semibold text-[#10243E]">{plan.name}</p>
              <p className="mt-1 text-2xl font-bold text-[#0F766E]">
                ₹{plan.price.toLocaleString("en-IN")}
                <span className="text-sm font-medium text-slate-500">/year</span>
              </p>
              <p className="mt-2 text-sm text-slate-600">{plan.storage}</p>
              <p className="text-sm text-slate-600">{plan.users}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-[#10243E]">
          {selected.name} · ₹{selected.price.toLocaleString("en-IN")}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt={`UPI QR for ${UPI_ID}`}
          width={320}
          height={320}
          className="mt-4 rounded-xl bg-white"
        />
        <p className="mt-4 text-lg font-semibold tracking-wide text-[#10243E]">{UPI_ID}</p>
        <p className="mt-1 text-xs text-slate-500">Inclusive of all taxes · GST not applicable</p>
        <a
          href={upiLink}
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#00BAF2] px-5 py-3 text-sm font-bold text-[#062033]"
        >
          Pay with UPI
        </a>
      </div>
    </div>
  );
}
