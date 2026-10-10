"use client";

import { useCallback, useEffect, useState } from "react";

import { Toast } from "@/components/dashboard/Toast";

type Payment = {
  id: string;
  company_domain: string;
  amount: number;
  status: string;
  created_at: string;
};

export function PaymentsAdminClient({ authed }: { authed: boolean }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/payments");
    const j = await res.json();
    if (res.ok) setPayments(j.payments || []);
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  async function approve(id: string) {
    const res = await fetch("/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: id }),
    });
    if (res.ok) {
      setToast("Subscription activated");
      load();
    } else setToast("Approve failed");
    setTimeout(() => setToast(""), 3000);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] p-8 text-slate-300">
        <p>Admin login required. Use super admin or workspace admin session.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-[#0A0E1A] px-4 pb-[140px] pt-6 sm:px-8">
      <h1 className="text-3xl font-bold text-white">Pending payments</h1>
      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#1E2639]">
        <table className="w-full text-left text-sm text-slate-200">
          <thead>
            <tr className="border-b border-white/10 text-slate-400">
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                  No pending payments
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-4 py-3">{p.company_domain}</td>
                  <td className="px-4 py-3">₹{p.amount}</td>
                  <td className="px-4 py-3">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => approve(p.id)}
                      className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Toast message={toast} />
    </div>
  );
}
