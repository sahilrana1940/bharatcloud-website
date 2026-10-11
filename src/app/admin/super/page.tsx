"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  CloudUpload,
  CreditCard,
  Users,
  Search,
  Bell,
  Settings,
} from "lucide-react";

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

export default function SuperAdminUltraProPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [bypass, setBypass] = useState(false);
  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/super/stats", { credentials: "include" });
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (!res.ok) return;
    const json = (await res.json()) as StatsPayload;
    setStats(json);
    setBypass(json.bypass === 1);
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

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white/60 flex items-center justify-center">
        Loading Nexus Admin…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-4 sm:p-6">
      <header
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 mb-6"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#22D3EE]" />
          <span className="text-xl font-bold tracking-tight">Nexus Admin</span>
          <span className="text-xs px-2 py-1 rounded-full border border-[#22D3EE]/40 text-[#22D3EE]">
            SUPER ADMIN
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08]"
          >
            <span className="text-xs font-bold tracking-wide">PAYMENT_BYPASS</span>
            <button
              type="button"
              disabled={toggling}
              onClick={toggleBypass}
              className={`relative w-12 h-7 rounded-full transition ${bypass ? "bg-[#22D3EE]" : "bg-white/20"}`}
              aria-pressed={bypass}
            >
              <span
                className={`absolute top-1 left-0 w-5 h-5 bg-white rounded-full shadow transition-transform ${bypass ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
            <span className="text-xs text-white/60">
              {bypass ? "ON (1) Test" : "OFF (0) Prod"}
            </span>
          </div>

          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
            <input
              placeholder="Search companies, users, logs..."
              className="bg-white/[0.06] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 w-[280px] text-sm outline-none focus:border-[#22D3EE]/50"
            />
          </div>
          <Bell className="w-5 h-5 text-white/70" />
          <Settings className="w-5 h-5 text-white/70" />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Companies"
          icon={<Building2 className="w-4 h-4 text-[#22D3EE]" />}
          value={stats.data.companies.toLocaleString()}
          sub="Registered tenants"
        />
        <MetricCard
          title="Billing"
          icon={<CreditCard className="w-4 h-4 text-[#22D3EE]" />}
          value={`₹${stats.data.billing.toLocaleString()}`}
          sub="Approved payments"
        />
        <MetricCard
          title="Backups"
          icon={<CloudUpload className="w-4 h-4 text-[#22D3EE]" />}
          value={stats.data.backups.toLocaleString()}
          sub="Backup job records"
        />
        <MetricCard
          title="User Access"
          icon={<Users className="w-4 h-4 text-[#22D3EE]" />}
          value={stats.data.users.toLocaleString()}
          sub="Workspace members"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5">
          <h3 className="font-bold mb-4 text-[#22D3EE]">Recent Companies</h3>
          <div className="space-y-0">
            {stats.recentCompanies.map((c) => (
              <div
                key={c.name}
                className="flex justify-between items-center gap-2 py-3 border-b border-white/[0.06] text-sm"
              >
                <span className="truncate flex-1">{c.name}</span>
                <span className="text-xs px-2 py-1 bg-white/10 rounded shrink-0">{c.plan}</span>
                <span
                  className={`text-xs px-2 py-1 rounded shrink-0 ${
                    c.status === "Suspended"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5">
          <h3 className="font-bold mb-4 text-[#22D3EE]">System Logs</h3>
          <div className="flex flex-wrap gap-2 mb-3 text-xs">
            {(
              [
                ["all", "All", "bg-[#22D3EE]/20 text-[#22D3EE]"],
                [402, "402", "bg-red-500/20 text-red-300"],
                [401, "401", "bg-yellow-500/20 text-yellow-300"],
                [200, "200", "bg-green-500/20 text-green-300"],
              ] as const
            ).map(([key, label, cls]) => (
              <button
                key={String(key)}
                type="button"
                onClick={() => setLogFilter(key as LogFilter)}
                className={`px-2 py-1 rounded transition ${cls} ${logFilter === key ? "ring-1 ring-white/30" : "opacity-70"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="text-xs space-y-2 font-mono text-white/60 max-h-64 overflow-y-auto">
            {filteredLogs.map((log, i) => (
              <p key={i}>
                <LogCode code={log.code} />
                {" • "}
                {log.message}
              </p>
            ))}
            {!filteredLogs.length && <p className="text-white/40">No logs for this filter.</p>}
          </div>
        </section>
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
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5"
    >
      <div className="flex gap-2 items-center text-white/60 text-sm mb-2">
        {icon}
        {title}
      </div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-white/50 mt-1">{sub}</div>
    </motion.div>
  );
}

function LogCode({ code }: { code: number }) {
  if (code === 402) return <span className="text-red-400">402 PAYMENT_REQUIRED</span>;
  if (code === 401) return <span className="text-yellow-400">401 UNAUTHORIZED</span>;
  return <span className="text-green-400">200 OK</span>;
}
