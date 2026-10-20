"use client";

import { useEffect, useState } from "react";

type Payment = {
  id: string;
  amount: number | null;
  status: string | null;
  created_at: string | null;
};

type Payload = {
  revenue: number;
  pending: number;
  message: string | null;
  payments: Payment[];
};

export default function SuperAdminBillingPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/stats-real", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 403) throw new Error("Forbidden — support@bharatcloud.store only");
        if (!res.ok) throw new Error("Billing request failed");
        return res.json();
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  const payments = data?.payments || [];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">Billing</h1>
      <p className="mt-1 text-sm text-zinc-500">Approved revenue is the sum of Razorpay payments stored in Supabase.</p>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-6">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Revenue INR</p>
          <p className="mt-3 text-4xl font-semibold tabular-nums">{data?.revenue ?? 0}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-6">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Pending</p>
          <p className="mt-3 text-4xl font-semibold tabular-nums">{data?.pending ?? 0}</p>
        </div>
      </div>
      {data?.message ? <p className="mt-6 text-sm text-zinc-400">{data.message}</p> : null}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-zinc-500">
                  No data yet - Real from Razorpay/E2E
                </td>
              </tr>
            ) : (
              payments.map((row) => (
                <tr key={row.id} className="border-t border-zinc-800">
                  <td className="px-4 py-3">{row.status || "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{Number(row.amount || 0)}</td>
                  <td className="px-4 py-3 text-zinc-400">{row.created_at || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
