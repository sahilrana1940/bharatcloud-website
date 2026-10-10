"use client";

import { useMemo, useState } from "react";

import { Toast } from "@/components/dashboard/Toast";

const AMOUNT = 1999;

export function BillingClient() {
  const [toast, setToast] = useState("");
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || "bharatcloud@upi";

  const upiLink = useMemo(
    () =>
      `upi://pay?pa=${encodeURIComponent(upiId)}&pn=BharatCloud&am=${AMOUNT}&cu=INR`,
    [upiId],
  );

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  async function confirmPaid() {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: AMOUNT }),
    });
    if (res.ok) notify("Thank you! Will activate in 2 hours");
    else notify("Could not record payment — try again");
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-[#0A0E1A] px-4 pb-[140px] pt-6 sm:px-8 lg:pb-10">
      <h1 className="text-3xl font-bold text-white">Billing</h1>
      <p className="mt-1 text-slate-500">BharatCloud Pro — ₹{AMOUNT}/month via UPI</p>

      <div className="mt-8 max-w-md rounded-2xl border border-white/10 bg-[#1E2639] p-6 text-center">
        <p className="text-sm text-slate-400">Scan to pay</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt="UPI QR" className="mx-auto mt-4 rounded-xl bg-white p-2" width={220} height={220} />
        <p className="mt-4 text-xs text-slate-500 break-all">{upiId}</p>
      </div>

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

      <button
        type="button"
        onClick={confirmPaid}
        className="mt-8 w-full max-w-md rounded-xl bg-emerald-600/90 py-3.5 text-sm font-semibold text-white"
      >
        I have paid ✅
      </button>

      <Toast message={toast} />
    </div>
  );
}
