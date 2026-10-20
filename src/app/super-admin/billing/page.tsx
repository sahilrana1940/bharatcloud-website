"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "@/components/super-admin/AdminShell";

type Stats = { revenue: number; upi: number; members: number };

export default function SuperAdminBillingPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/stats-real", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 403) throw new Error("403 Forbidden");
        if (!res.ok) throw new Error("Billing request failed");
        return res.json();
      })
      .then(setStats)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AdminShell active="Billing">
      <h1 className="text-3xl font-semibold tracking-tight text-white">Billing</h1>
      <p className="mt-1 text-sm text-zinc-500">Razorpay and UPI totals. Empty means no captured payments.</p>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-zinc-800 bg-[#111113] p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Revenue INR</p>
          <p className="mt-4 text-5xl font-bold text-white">{stats?.revenue ?? 0}</p>
          <span className="mt-3 inline-flex rounded-full border border-emerald-400 px-2 py-0.5 text-[10px] text-emerald-400">
            Real No fake
          </span>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-[#111113] p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">UPI</p>
          <p className="mt-4 text-5xl font-bold text-white">{stats?.upi ?? 0}</p>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-[#111113] p-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Paying members</p>
          <p className="mt-4 text-5xl font-bold text-white">{stats?.members ?? 0}</p>
        </article>
      </div>
      <p className="mt-8 text-sm text-zinc-400">No data yet - Real from Razorpay/E2E</p>
    </AdminShell>
  );
}
