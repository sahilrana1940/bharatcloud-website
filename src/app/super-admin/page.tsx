"use client";

import { useEffect, useState } from "react";

type Stats = {
  tenants: number;
  users: number;
  storageGb: number;
  revenue: number;
  backups: number;
  pending: number;
  message: string | null;
  infra: { vm: number; storage: number; bandwidth: number; total: number };
};

const FIXES = ["LOGS", "CACHE", "STORAGE", "INFRA"] as const;

export default function SuperAdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fixResult, setFixResult] = useState("");
  const [running, setRunning] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/stats-real", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 403) throw new Error("Forbidden — support@bharatcloud.store only");
        if (!res.ok) throw new Error("Stats request failed");
        return res.json();
      })
      .then(setStats)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function runFix(fix: (typeof FIXES)[number]) {
    setRunning(fix);
    setFixResult("");
    try {
      const res = await fetch("/api/super-admin/fix", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fix }),
      });
      const data = await res.json();
      if (res.status === 403) {
        setFixResult("Forbidden — support@bharatcloud.store only");
        return;
      }
      setFixResult(JSON.stringify(data));
    } catch {
      setFixResult("Fix request failed");
    } finally {
      setRunning("");
    }
  }

  const cards = [
    { label: "Tenants", value: stats?.tenants ?? 0 },
    { label: "Users", value: stats?.users ?? 0 },
    { label: "Storage GB", value: stats?.storageGb ?? 0 },
    { label: "Revenue INR", value: stats?.revenue ?? 0 },
    { label: "Backups", value: stats?.backups ?? 0 },
    { label: "Pending payments", value: stats?.pending ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">Overview</h1>
      <p className="mt-1 text-sm text-zinc-500">Live counts from Supabase, Razorpay payments, and E2E storage.</p>
      {loading ? <p className="mt-4 text-sm text-zinc-500">Loading real counts…</p> : null}
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      {stats?.message ? <p className="mt-4 text-sm text-zinc-400">{stats.message}</p> : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-6">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{card.label}</p>
            <p className="mt-3 text-4xl font-semibold tabular-nums text-white">{loading ? "—" : card.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <h2 className="text-sm font-semibold text-white">Bug fix</h2>
        <p className="mt-1 text-xs text-zinc-500">Runs a real check. Nothing here invents tenants or revenue.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {FIXES.map((fix) => (
            <button
              key={fix}
              type="button"
              onClick={() => runFix(fix)}
              disabled={running === fix}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-semibold tracking-wide text-white hover:bg-white hover:text-black disabled:opacity-50"
            >
              {running === fix ? "Running…" : fix}
            </button>
          ))}
        </div>
        {fixResult ? (
          <pre className="mt-4 overflow-x-auto rounded-lg bg-black p-3 text-xs text-zinc-400">{fixResult}</pre>
        ) : null}
      </section>
    </div>
  );
}
