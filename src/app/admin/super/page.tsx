"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  CloudUpload,
  CreditCard,
  RefreshCw,
  Users,
} from "lucide-react";

import Link from "next/link";

type StatsPayload = {
  data: {
    companies: number;
    users: number;
    backups: number;
    billing: number;
  };
  bypass: 0 | 1;
  recentCompanies: { name: string; plan: string; status: string }[];
  logs: { code: number; message: string }[];
};

type LogFilter = "all" | 402 | 401 | 200;

type LoadState = "loading" | "ready" | "error";

export default function SuperAdminUltraProPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [bypass, setBypass] = useState(false);
  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    setLoadState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/super/stats", { credentials: "include" });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.status === 403) {
        router.replace("/dashboard");
        return;
      }
      if (!res.ok) {
        setLoadState("error");
        setErrorMsg("Could not load super admin stats.");
        return;
      }
      const json = (await res.json()) as StatsPayload;
      setStats(json);
      setBypass(json.bypass === 1);
      setLoadState("ready");
    } catch {
      setLoadState("error");
      setErrorMsg("Network error. Try again.");
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleBypass() {
    const next = !bypass;
    setToggling(true);
    try {
      const res = await fetch("/api/billing/status", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bypass: next }),
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.ok) {
        const j = (await res.json()) as { bypass: 0 | 1 };
        setBypass(j.bypass === 1);
        await load();
      }
    } finally {
      setToggling(false);
    }
  }

  const filteredLogs = useMemo(() => {
    if (!stats) return [];
    if (logFilter === "all") return stats.logs;
    return stats.logs.filter((l) => l.code === logFilter);
  }, [stats, logFilter]);

  if (loadState === "loading") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
        <p>Loading super console…</p>
      </div>
    );
  }

  if (loadState === "error" || !stats) {
    return (
      <div className="pro-glass rounded-2xl p-8 text-center">
        <p className="text-slate-700">{errorMsg || "Something went wrong."}</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-2 text-sm font-bold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 text-xs font-medium text-slate-500">
        <Link href="/admin" className="hover:text-cyan-600">Admin</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">Super console</span>
      </div>

      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between pro-glass rounded-2xl p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 text-xs font-black text-white">
              BC
            </span>
            <h1 className="text-2xl font-bold text-slate-900">BharatCloud Super Admin</h1>
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-700">
              Live
            </span>
          </div>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Platform metrics, payment test bypass, and backup API logs (401 / 402 / 200).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-cyan-200"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-xs font-bold text-slate-700">PAYMENT_BYPASS</span>
            <button
              type="button"
              disabled={toggling}
              onClick={toggleBypass}
              className={`relative h-7 w-12 rounded-full transition ${bypass ? "bg-cyan-500" : "bg-slate-300"}`}
              aria-pressed={bypass}
              aria-label="Toggle payment bypass"
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${bypass ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
            <span className="text-xs text-slate-500">{bypass ? "Test (1)" : "Prod (0)"}</span>
          </div>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Companies"
          icon={<Building2 className="h-4 w-4 text-cyan-600" />}
          value={stats.data.companies.toLocaleString()}
          sub="Tenants on Supabase"
        />
        <MetricCard
          title="Billing"
          icon={<CreditCard className="h-4 w-4 text-cyan-600" />}
          value={`₹${stats.data.billing.toLocaleString()}`}
          sub="Approved payments"
        />
        <MetricCard
          title="Backups"
          icon={<CloudUpload className="h-4 w-4 text-cyan-600" />}
          value={stats.data.backups.toLocaleString()}
          sub="Backup jobs"
        />
        <MetricCard
          title="Users"
          icon={<Users className="h-4 w-4 text-cyan-600" />}
          value={stats.data.users.toLocaleString()}
          sub="Workspace members"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="pro-glass rounded-2xl p-5">
          <h2 className="mb-4 font-bold text-slate-900">Recent companies</h2>
          {stats.recentCompanies.length === 0 ? (
            <p className="text-sm text-slate-500">No companies yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.recentCompanies.map((c) => (
                <li
                  key={c.name}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{c.name}</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{c.plan}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      c.status === "Suspended"
                        ? "bg-red-50 text-red-600"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="pro-glass rounded-2xl p-5">
          <h2 className="mb-4 font-bold text-slate-900">System logs</h2>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            {(
              [
                ["all", "All"],
                [402, "402"],
                [401, "401"],
                [200, "200"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={String(key)}
                type="button"
                onClick={() => setLogFilter(key as LogFilter)}
                className={`rounded-lg px-3 py-1 font-medium transition ${
                  logFilter === key
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/80 p-3 font-mono text-xs text-slate-600">
            {filteredLogs.map((log, i) => (
              <p key={i} className="leading-relaxed">
                <LogCode code={log.code} />
                <span className="text-slate-400"> · </span>
                {log.message}
              </p>
            ))}
            {!filteredLogs.length && (
              <p className="text-slate-400">No logs for this filter.</p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/admin" className="text-cyan-700 hover:underline">Platform overview</Link>
        <Link href="/admin/payments" className="text-cyan-700 hover:underline">Approve payments</Link>
        <Link href="/dashboard/drive" className="text-slate-500 hover:text-cyan-700">Workspace</Link>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  icon,
  value,
  sub,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  sub: string;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} className="pro-glass rounded-2xl p-5">
      <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
        {icon}
        {title}
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </motion.div>
  );
}

function LogCode({ code }: { code: number }) {
  if (code === 402) return <span className="font-semibold text-red-600">402</span>;
  if (code === 401) return <span className="font-semibold text-amber-600">401</span>;
  return <span className="font-semibold text-emerald-600">200</span>;
}
