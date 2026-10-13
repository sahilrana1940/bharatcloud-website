"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Toast } from "@/components/dashboard/Toast";
import {
  BILLING_PLANS,
  type BillingPlanId,
  getUpiLink,
} from "@/lib/billing/plans";

const PRO_FEATURES = [
  "Automatic full Google Drive archive",
  "Google Drive archive to central vault",
  "Encrypted vault + company hot storage",
  "India-hosted per-company archive bucket",
  "Team dashboard & per-user backup status",
];

type BillingConfig = {
  upiLive?: boolean;
  simulateUpiFlow?: boolean;
};

export function BillingClient() {
  const router = useRouter();
  const [toast, setToast] = useState("");
  const [active, setActive] = useState(false);
  const [selectedId, setSelectedId] = useState<BillingPlanId>("starter");
  const [billingConfig, setBillingConfig] = useState<BillingConfig>({
    simulateUpiFlow: true,
  });
  const [proofUrl, setProofUrl] = useState("");
  const [proofNote, setProofNote] = useState("");

  const selected = BILLING_PLANS.find((p) => p.id === selectedId) ?? BILLING_PLANS[0];
  const simulateUpi = billingConfig.simulateUpiFlow !== false;

  useEffect(() => {
    Promise.all([
      fetch("/api/billing/status").then((r) => r.json()),
      fetch("/api/billing/config").then((r) => r.json()),
    ]).then(([status, cfg]) => {
      if (status.active) setActive(true);
      setBillingConfig(cfg);
    });
  }, []);

  const upiLink = useMemo(
    () => getUpiLink(selected.price, selected.name),
    [selected.price, selected.name],
  );

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

  const upiId = simulateUpi ? "demo@upi (no real money today)" : "Set NEXT_PUBLIC_UPI_ID on server";
  const payeeName = simulateUpi ? "BharatCloud — super admin approves" : "UPI payee";

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  async function confirmPaid() {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: selected.price,
        plan: selected.id,
        proofUrl: proofUrl.trim(),
        proofNote: proofNote.trim(),
      }),
    });
    const j = await res.json();
    if (res.ok) {
      if (j.approved) {
        router.push(j.redirect || "/dashboard/team?paid=1");
        return;
      }
      notify(
        simulateUpi
          ? "Request sent — super admin will approve at /admin/payments (no real UPI charge today)."
          : "Payment recorded — we will activate after verification.",
      );
      router.push("/dashboard/team");
    } else notify(j.error || "Could not record payment — try again");
  }

  if (active) {
    return (
      <div className="min-h-screen overflow-y-auto bg-transparent px-4 pb-[140px] pt-6 sm:px-8 lg:pb-10">
        <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
        <div className="mt-8 max-w-lg rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
          <p className="font-semibold text-emerald-100">BharatCloud subscription is active</p>
          <p className="mt-2 text-sm text-emerald-200/90">
            Connect Google on Team &amp; backup to start your automatic archive.
          </p>
          <Link
            href="/dashboard/team"
            className="mt-4 inline-block rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white"
          >
            Go to Team &amp; backup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-transparent px-4 pb-[140px] pt-6 sm:px-8 lg:pb-10">
      <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
      <p className="mt-1 text-slate-500">Choose a plan — pay via UPI (monthly)</p>
      {simulateUpi ? (
        <p className="mt-3 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>Demo / rehearsal mode:</strong> आज असली UPI पर पैसा नहीं जाएगा। Plan चुनें → नीचे{" "}
          <strong>I have paid</strong> दबाएँ → owner/super admin{" "}
          <a href="/admin/payments" className="font-semibold text-cyan-800 underline">
            Pending payments
          </a>{" "}
          से Approve करेगा। Live UPI के लिए Vercel पर{" "}
          <code className="text-xs">BILLING_UPI_LIVE=1</code> + अपना VPA।
        </p>
      ) : null}

      <div className="mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
        {BILLING_PLANS.map((plan) => {
          const isSelected = plan.id === selectedId;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedId(plan.id)}
              className={`relative rounded-2xl border p-5 text-left transition ${
                isSelected
                  ? "border-cyan-500/60 bg-cyan-500/10 ring-1 ring-cyan-500/40"
                  : "border-white/10 bg-[#1E2639] hover:border-white/20"
              }`}
            >
              {plan.tag ? (
                <span className="absolute -top-2.5 left-4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {plan.tag}
                </span>
              ) : null}
              <p className="text-lg font-semibold text-white">{plan.name}</p>
              <p className="mt-1 text-2xl font-bold text-cyan-300">₹{plan.price}</p>
              <p className="mt-2 text-sm text-slate-400">{plan.users}</p>
              <p className="text-sm text-slate-400">{plan.storage}</p>
            </button>
          );
        })}
      </div>

      <ul className="mt-8 max-w-lg space-y-2">
        {PRO_FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-8 max-w-md rounded-2xl border border-white/10 bg-[#1E2639] p-6 text-center">
        <p className="text-sm text-slate-400">
          {simulateUpi ? "Rehearsal QR (₹1 demo — do not use for real pay)" : "Scan to pay"} —{" "}
          <span className="text-slate-200">{selected.name}</span> ₹{selected.price}
        </p>
        {simulateUpi ? (
          <div className="mx-auto mt-4 flex h-[220px] w-[220px] items-center justify-center rounded-xl border border-dashed border-slate-500 bg-slate-800/50 p-4 text-xs text-slate-300">
            Skip real UPI today. Tap the green button below — super admin approves the plan.
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={qrUrl}
            alt="UPI QR"
            className="mx-auto mt-4 rounded-xl bg-white p-2"
            width={220}
            height={220}
          />
        )}
        <p className="mt-2 text-sm text-slate-300">{payeeName}</p>
        <p className="mt-1 text-xs text-slate-500 break-all">{upiId}</p>
        <p className="mt-2 text-[10px] text-slate-600">
          IDFC FIRST Bank · tn=Bharat Cloud {selected.name}
        </p>
      </div>

      {!simulateUpi ? (
        <div className="mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
          <a
            href={upiLink}
            className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 py-3 text-sm font-semibold text-white"
          >
            Pay with GPay
          </a>
          <a
            href={upiLink}
            className="flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-[#1E2639] py-3 text-sm font-semibold text-slate-200"
          >
            Pay with PhonePe
          </a>
        </div>
      ) : null}

      <div className="mt-8 max-w-md space-y-3 rounded-2xl border border-white/10 bg-[#1E2639] p-5">
        <p className="text-sm font-medium text-slate-200">After UPI payment</p>
        <p className="text-xs text-slate-400">
          Screenshot bhejo (WhatsApp / Drive link paste karo). BharatCloud admin approve karega —
          plan active ho jayega.
        </p>
        <input
          type="url"
          value={proofUrl}
          onChange={(e) => setProofUrl(e.target.value)}
          placeholder="Screenshot link (Google Drive / imgur URL)"
          className="w-full rounded-lg border border-white/10 bg-[#0A0E1A] px-3 py-2.5 text-sm text-slate-100"
        />
        <input
          type="text"
          value={proofNote}
          onChange={(e) => setProofNote(e.target.value)}
          placeholder="Optional note — UTR / time / phone used"
          className="w-full rounded-lg border border-white/10 bg-[#0A0E1A] px-3 py-2.5 text-sm text-slate-100"
        />
      </div>

      <button
        type="button"
        onClick={confirmPaid}
        className="mt-6 w-full max-w-md rounded-xl bg-emerald-600/90 py-3.5 text-sm font-semibold text-white"
      >
        {simulateUpi
          ? `Request plan activation (₹${selected.price} UPI rehearsal)`
          : `I have paid ₹${selected.price} — start backup setup`}
      </button>

      <Toast message={toast} />
    </div>
  );
}
