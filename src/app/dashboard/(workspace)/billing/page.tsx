"use client";

import { Check } from "lucide-react";
import { useState } from "react";

const VPA = process.env.NEXT_PUBLIC_BILLING_UPI_VPA || "Sahilrana1940@paytm";
const IS_LIVE = process.env.NEXT_PUBLIC_BILLING_UPI_LIVE === "1" || true;

const PLANS = [
  {
    id: "starter" as const,
    name: "STARTER",
    price: 5999,
    users: "5 Users",
    storage: "100GB per ID",
    badge: "",
  },
  {
    id: "growth" as const,
    name: "GROWTH",
    price: 12999,
    users: "20 Users",
    storage: "200GB per ID",
    badge: "MOST POPULAR",
  },
  {
    id: "scale" as const,
    name: "SCALE",
    price: 14999,
    users: "50 Users",
    storage: "500GB per ID",
    badge: "BEST FOR BUSINESS",
  },
];

const FEATURES = [
  "Automatic full Google Drive archive",
  "Google Drive archive to central vault",
  "Encrypted vault + company hot storage",
  "India-hosted per-company archive bucket (E2E Mumbai - Rs1700 Fixed infra)",
  "Team dashboard & per-user backup status",
];

type PlanId = (typeof PLANS)[number]["id"];

function upiLinkFor(price: number, planName: string) {
  return `upi://pay?pa=${VPA}&pn=BharatCloud&am=${price}&cu=INR&tn=BharatCloud-${planName}`;
}

export default function BillingPage() {
  const [selectedId, setSelectedId] = useState<PlanId>("starter");
  const [modalOpen, setModalOpen] = useState(false);
  const [note, setNote] = useState("");

  const selected = PLANS.find((plan) => plan.id === selectedId) ?? PLANS[0];
  const upiLink = upiLinkFor(selected.price, selected.name);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;

  function handleSelectPlan(id: PlanId) {
    setSelectedId(id);
    if (IS_LIVE) setModalOpen(true);
  }

  async function markPaid() {
    const res = await fetch("/api/billing/mark-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: selected.id, amount: selected.price }),
    });
    const body = await res.json().catch(() => ({}));
    setNote(res.ok ? "Marked paid. Super Admin can approve it in Pending Payments." : body.error || "Could not mark paid.");
    setModalOpen(false);
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-transparent px-4 pb-24 pt-6 text-slate-900 sm:px-8">
      <h1 className="text-3xl font-bold">Billing</h1>
      <p className="mt-2 text-slate-600">
        Hosted on Hostinger. Storage on E2E Mumbai. Infra Rs1700 Fixed. Pay with Paytm only.
      </p>
      {IS_LIVE ? (
        <div className="mt-3 max-w-3xl rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
          <span className="font-bold text-green-700">✓ LIVE Mode:</span> Pay securely via Paytm UPI to {VPA} - Hosted on Hostinger, Storage on E2E Mumbai (Rs1700 Fixed)
        </div>
      ) : (
        <div className="mt-3 max-w-3xl rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm">
          Rehearsal mode ON: No real UPI charge right now. Click any plan → I Have Paid → Super Admin approves. To go LIVE: Add BILLING_UPI_LIVE=1 on Vercel.
        </div>
      )}

      <div className="mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const popular = plan.badge === "MOST POPULAR";
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => handleSelectPlan(plan.id)}
              className={`relative z-10 cursor-pointer rounded-2xl border bg-white p-5 text-left ${
                popular ? "scale-105 border-orange-500 shadow-[0_0_20px_#f97316]" : "border-slate-200"
              } ${selectedId === plan.id ? "ring-2 ring-orange-400" : ""}`}
            >
              {plan.badge ? (
                <span className="absolute -top-2.5 left-4 rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {plan.badge}
                </span>
              ) : null}
              <p className="text-lg font-semibold">{plan.name}</p>
              <p className="mt-1 text-2xl font-bold">Rs {plan.price.toLocaleString("en-IN")}</p>
              <p className="mt-2 text-sm text-slate-600">{plan.users}</p>
              <p className="text-sm text-slate-600">{plan.storage}</p>
            </button>
          );
        })}
      </div>

      <ul className="mt-8 max-w-lg space-y-2">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8 max-w-md rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-700">
          Paytm rehearsal - no real charge - Selected: {selected.name} Rs {selected.price.toLocaleString("en-IN")}
        </p>
        <button
          type="button"
          onClick={markPaid}
          className="mt-4 w-full rounded-xl bg-[#10243E] py-3 text-sm font-semibold text-white"
        >
          I Have Paid
        </button>
        {note ? <p className="mt-3 text-sm text-slate-600">{note}</p> : null}
      </div>

      {modalOpen && IS_LIVE ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center">
            <p className="text-lg font-semibold">{selected.name}</p>
            <p className="mt-1 text-sm text-slate-500">Pay {VPA}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="Paytm UPI QR" className="mx-auto mt-4" width={200} height={200} />
            <a href={upiLink} className="mt-4 flex w-full items-center justify-center rounded-xl bg-orange-500 py-3 text-sm font-bold text-white">
              Pay Rs {selected.price.toLocaleString("en-IN")} with Paytm UPI
            </a>
            <button type="button" onClick={markPaid} className="mt-3 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold">
              I Have Paid
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="mt-2 text-xs text-slate-500">
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
