"use client";

import { useEffect, useState } from "react";

import { SaasShell } from "@/components/super-admin/SaasShell";
import { BANK_UPI_ID, BANK_UPI_LABEL, RAZORPAY_METHOD, UPI_QR_URL } from "@/lib/super-admin/locked-spec";

type Overview = {
  upiReceived: number;
  razorpayReceived: number;
  transactions: Array<{ id: string; company: string; plan: string; amount: number; method: string; status: string }>;
};

export default function BillingCockpitPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/super-admin/overview", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load billing");
        setData(json);
      })
      .catch((err: Error) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  const pending = (data?.transactions || []).filter((row) => row.status === "pending" && row.method.includes(BANK_UPI_ID));
  const pendingAmount = pending.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  async function approve(row: Overview["transactions"][number]) {
    const res = await fetch("/api/super-admin/billing/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: row.id, plan: row.plan, companyId: row.company }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Approve failed");
      return;
    }
    load();
  }

  return (
    <SaasShell title="Billing Cockpit">
      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-semibold text-white">{BANK_UPI_LABEL}</p>
          <p className="mt-2 text-sm text-zinc-400">IDFC First Bank UPI · {BANK_UPI_ID}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={UPI_QR_URL} alt="Direct Bank UPI QR" className="mt-4 rounded-xl bg-white p-2" width={180} height={180} />
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-semibold text-white">App payment</p>
          <p className="mt-2 text-sm text-zinc-400">{RAZORPAY_METHOD} only</p>
        </article>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-white/10 p-4">
          <p className="text-xs uppercase text-zinc-500">Total UPI Received</p>
          <p className="mt-2 text-3xl font-bold">₹{data?.upiReceived ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-white/10 p-4">
          <p className="text-xs uppercase text-zinc-500">Total Razorpay Received</p>
          <p className="mt-2 text-3xl font-bold">₹{data?.razorpayReceived ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-white/10 p-4">
          <p className="text-xs uppercase text-zinc-500">Pending Amount</p>
          <p className="mt-2 text-3xl font-bold">₹{pendingAmount}</p>
        </article>
      </div>

      <h2 className="mb-3 mt-10 text-lg font-semibold">Pending Approvals for Bank UPI</h2>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-zinc-400">
            <tr>
              {["Company", "Plan", "Amount", "Method", "Action"].map((head) => (
                <th key={head} className="px-4 py-3">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pending.map((row) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="px-4 py-3">{row.company}</td>
                <td className="px-4 py-3">{row.plan}</td>
                <td className="px-4 py-3">₹{row.amount}</td>
                <td className="px-4 py-3">{row.method}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => approve(row)} className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-black">
                    Approve
                  </button>
                </td>
              </tr>
            ))}
            {!pending.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No pending Bank UPI approvals.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </SaasShell>
  );
}
