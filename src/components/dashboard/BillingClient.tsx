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
import { paytmDeepLink } from "@/lib/billing/paytm";
import { BILLING_UPI_NUMBER, billingUpiName, billingUpiVpa } from "@/lib/billing/upi";

const PRO_FEATURES = [
  "Automatic full Google Drive archive",
  "1 Month FREE for all mail IDs - 2nd month se MRR",
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
  const [userCount, setUserCount] = useState(3); // 1 Admin + 2 Branch

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
  const paytmLink = paytmDeepLink(selected.price, `Bharat Cloud ${selected.name}`);
  // FIX: QR me hamesha UPI link hi daalo
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;
  const upiId = billingUpiVpa();
  const payeeName = billingUpiName();

  // MRR Calculation - teri 199/49/99 wali logic
  const monthlyBill = useMemo(() => {
    if (userCount <= 0) return 0;
    const admin = 199;
    const extraUpto5 = Math.min(Math.max(userCount - 1, 0), 4) * 49;
    const extraBeyond = Math.max(userCount - 5, 0) * 99;
    return admin + extraUpto5 + extraBeyond;
  }, [userCount]);

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
        userCount,
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
          ? "Request sent — super admin will approve at /admin/payments"
          : "Payment recorded — we will activate after verification.",
      );
      router.push("/dashboard/team");
    } else notify(j.error || "Could not record payment — try again");
  }

  if (active) {
    return (
      <div className="min-h-screen overflow-y-auto bg-transparent px-4 pb-[140px] pt-6 sm:px-8 lg:pb-10">
        <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
        <div className="mt-8 max-w-lg rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
          <p className="font-semibold text-emerald-800">BharatCloud subscription is active</p>
          <p className="mt-2 text-sm text-slate-600">Your trial is active. 2nd month se MRR: ₹{monthlyBill}/mo</p>
          <Link href="/dashboard/team" className="mt-4 inline-block rounded-xl bg-[#00BAF2] px-6 py-3 text-sm font-semibold text-[#062033]">Go to Team & backup</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-transparent px-4 pb-[140px] pt-6 sm:px-8 lg:pb-10">
      <h1 className="text-3xl font-bold text-slate-900">Billing</h1>
      <p className="mt-1 text-slate-600">Hosted on Hostinger. Storage on E2E Mumbai. Pay with Paytm only.</p>
      
      <div className="mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
        {BILLING_PLANS.map((plan) => {
          const isSelected = plan.id === selectedId;
          return (
            <button key={plan.id} type="button" onClick={() => setSelectedId(plan.id)} className={`relative rounded-2xl border p-5 text-left transition ${isSelected ? "border-[#00BAF2] bg-white ring-2 ring-[#00BAF2]" : "border-[#10243E]/10 bg-white hover:border-[#10243E]/30"}`}>
              {plan.id === 'starter' && <span className="absolute -top-2.5 left-4 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-bold text-white">1 Month FREE</span>}
              {plan.tag ? <span className="absolute -top-2.5 right-4 rounded-full bg-[#10243E] px-2.5 py-0.5 text-[10px] font-bold text-white">{plan.tag}</span> : null}
              <p className="text-lg font-semibold text-[#10243E]">{plan.name}</p>
              <p className="mt-1 text-2xl font-bold text-[#0F766E]">₹{plan.price}<span className="text-sm font-medium text-slate-500">/year</span></p>
              <p className="text-xs font-semibold text-emerald-700">+ 30 Days FREE</p>
              <p className="mt-2 text-sm text-slate-600">{plan.users}</p>
              <p className="text-sm text-slate-600">{plan.storage}</p>
            </button>
          );
        })}
      </div>

      {/* NAYA CALCULATOR - 3 ID wala case */}
      <div className="mt-6 max-w-4xl rounded-2xl border border-[#00BAF2]/20 bg-blue-50/50 p-5">
        <p className="text-sm font-bold text-[#10243E]">Chhoti company? (1 Admin + Branch IDs)</p>
        <div className="mt-3 flex items-center gap-4">
          <span className="text-sm w-16">IDs: {userCount}</span>
          <input type="range" min={1} max={15} value={userCount} onChange={(e) => setUserCount(Number(e.target.value))} className="flex-1 accent-[#00BAF2]" />
        </div>
        <div className="mt-3 flex gap-6 text-sm">
          <p>1st Month: <span className="font-bold text-emerald-600">₹0 FREE</span></p>
          <p>2nd Month se: <span className="font-bold">₹{monthlyBill}/mo</span></p>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Formula: 1st Admin ₹199 + 2nd to 5th ₹49 + 6th se ₹99</p>
      </div>

      <ul className="mt-8 max-w-lg space-y-2">
        {PRO_FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-[#10243E]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0F766E]" />{f}</li>
        ))}
      </ul>

      <div className="mt-8 max-w-md rounded-2xl border border-[#10243E]/10 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-600"><span className="font-medium text-[#10243E]">{selected.name}</span> ₹{selected.price} + MRR</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt="UPI QR" className="mx-auto mt-4 rounded-xl bg-white p-2" width={220} height={220} />
        <p className="mt-2 text-sm text-[#10243E]">{payeeName}</p>
        <p className="mt-1 break-all text-xs text-slate-500">{upiId}</p>
        <p className="mt-1 text-sm font-medium text-[#10243E]">UPI Number: {BILLING_UPI_NUMBER}</p>
      </div>

      <div className="mt-8 max-w-md space-y-3 rounded-2xl border border-[#10243E]/10 bg-white p-5 shadow-sm">
        <input type="url" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} placeholder="Screenshot link" className="w-full rounded-lg border border-slate-200 bg-[#F4EFE6] px-3 py-2.5 text-sm text-[#10243E]" />
        <input type="text" value={proofNote} onChange={(e) => setProofNote(e.target.value)} placeholder="UTR / Note" className="w-full rounded-lg border border-slate-200 bg-[#F4EFE6] px-3 py-2.5 text-sm text-[#10243E]" />
      </div>

      <button type="button" onClick={confirmPaid} className="mt-6 w-full max-w-md rounded-xl bg-[#10243E] py-3.5 text-sm font-semibold text-white">
        {simulateUpi ? `Request Activation (₹${selected.price} + 1 Month FREE)` : `I paid ₹${selected.price}`}
      </button>

      <Toast message={toast} />
    </div>
  );
}