"use client";

import { useEffect, useState } from "react";

import { AdminShell, BugFixPanel, FIX_BUTTONS } from "@/components/super-admin/AdminShell";

type Infra = { vm: number; storage: number; bandwidth: number; total: number };
type Stats = {
  storageUsed: number;
  storageTotal: number;
  objectCount?: number;
  bucket?: string;
  endpoint?: string;
  region?: string;
  storageError?: string | null;
  storageWarning?: string | null;
  infra: Infra;
};

export default function SuperAdminInfrastructurePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/super-admin/stats-real", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 403) throw new Error("403 Forbidden");
        if (!res.ok) throw new Error("Infrastructure request failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const used = stats?.storageUsed ?? 0;
  const total = stats?.storageTotal ?? 0;
  const infra = stats?.infra ?? { vm: 800, storage: 0, bandwidth: 300, total: 1100 };
  const pct = total ? Math.min(100, (used / total) * 100) : 0;

  return (
    <AdminShell active="Infrastructure">
      <h1 className="text-3xl font-semibold tracking-tight text-white">Infrastructure</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Used GB comes from E2E ListObjectsV2. The endpoint is E2E_ENDPOINT (Delhi https://objectstore.e2enetworks.net, or Chennai https://in-south1-objectstore.e2enetworks.net). VM and bandwidth stay on the infra sheet. Storage INR follows measured GB.
      </p>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      <article id="storage" className="mt-8 rounded-xl border border-zinc-800 bg-[#111113] p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Storage</p>
          <span className="rounded-full border border-emerald-400 px-2 py-0.5 text-[10px] text-emerald-400">Real</span>
        </div>
        <p className="mt-4 text-5xl font-bold text-white">{used.toFixed(3)} GB used</p>
        <p className="mt-2 text-xs text-zinc-500">
          {stats?.bucket || "bharatcloudfinal2"} · {stats?.objectCount ?? 0} objects
          {stats?.endpoint ? ` · ${stats.endpoint}` : ""}
          {stats?.region ? ` · ${stats.region}` : ""}
        </p>
        {stats?.storageWarning ? <p className="mt-2 text-sm text-amber-300">{stats.storageWarning}</p> : null}
        {stats?.storageError ? <p className="mt-2 text-sm text-red-400">{stats.storageError}</p> : null}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full bg-emerald-400" style={{ width: `${pct}%` }} />
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
        <BugFixPanel
          buttons={FIX_BUTTONS}
          onDone={(type, ok) => {
            if (ok && (type === "STORAGE" || type === "INFRA" || type === "CACHE")) setReloadKey((n) => n + 1);
          }}
        />
      </div>
    </AdminShell>
  );
}
