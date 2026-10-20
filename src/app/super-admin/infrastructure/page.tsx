"use client";

import { useEffect, useState } from "react";

import { AdminShell, BugFixPanel, FIX_BUTTONS } from "@/components/super-admin/AdminShell";

type Infra = { vm: number; storage: number; bandwidth: number; total: number };
type Stats = { storageUsed: number; storageTotal: number; infra: Infra };

export default function SuperAdminInfrastructurePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/stats-real", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 403) throw new Error("403 Forbidden");
        if (!res.ok) throw new Error("Infrastructure request failed");
        return res.json();
      })
      .then(setStats)
      .catch((err: Error) => setError(err.message));
  }, []);

  const used = stats?.storageUsed ?? 0;
  const total = stats?.storageTotal ?? 0;
  const infra = stats?.infra ?? { vm: 800, storage: 600, bandwidth: 300, total: 1700 };

  return (
    <AdminShell active="Infrastructure">
      <h1 className="text-3xl font-semibold tracking-tight text-white">Infrastructure</h1>
      <p className="mt-1 text-sm text-zinc-500">Mumbai E2E. Storage used is measured. Cost is the fixed infra sheet.</p>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      <article id="storage" className="mt-8 rounded-xl border border-zinc-800 bg-[#111113] p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Storage</p>
          <span className="rounded-full border border-emerald-400 px-2 py-0.5 text-[10px] text-emerald-400">Real</span>
        </div>
        <p className="mt-4 text-5xl font-bold text-white">{used} GB used</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full bg-emerald-400" style={{ width: `${total ? (used / total) * 100 : 0}%` }} />
        </div>
      </article>

      <div id="networking" className="mt-4 grid gap-4 md:grid-cols-4">
        {(
          [
            ["VM", infra.vm],
            ["Storage cost", infra.storage],
            ["Bandwidth", infra.bandwidth],
            ["Total cost", infra.total],
          ] as const
        ).map(([label, value]) => (
          <article key={label} id={label === "VM" ? "compute" : undefined} className="rounded-xl border border-zinc-800 bg-[#111113] p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">{label} INR</p>
            <p className="mt-3 text-3xl font-bold text-white">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-6">
        <BugFixPanel buttons={FIX_BUTTONS} />
      </div>
    </AdminShell>
  );
}
