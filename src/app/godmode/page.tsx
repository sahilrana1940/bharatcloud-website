"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  totalWorkspaces: number;
  storageUsed: number;
  gmailPending: number;
  drivePending: number;
  backupCount: number;
  infraCost: number;
};

type Workspace = {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  storage: string;
};

type Tier = { name: string; used: string; limit: string };
type Approval = { user: string; type: string; status: string; date: string };

const EMPTY_STATS: Stats = {
  totalWorkspaces: 0,
  storageUsed: 0,
  gmailPending: 0,
  drivePending: 0,
  backupCount: 0,
  infraCost: 1700,
};

export default function GodModePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [emptyNote, setEmptyNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [statsRes, workRes, storeRes, approveRes] = await Promise.all([
          fetch("/api/godmode", { cache: "no-store" }),
          fetch("/api/godmode/workspaces", { cache: "no-store" }),
          fetch("/api/godmode/storage", { cache: "no-store" }),
          fetch("/api/godmode/approvals", { cache: "no-store" }),
        ]);
        if (!statsRes.ok || !workRes.ok || !storeRes.ok || !approveRes.ok) {
          throw new Error("godmode api");
        }
        const statsJson = (await statsRes.json()) as Stats;
        const workJson = (await workRes.json()) as { workspaces?: Workspace[] };
        const storeJson = (await storeRes.json()) as { tiers?: Tier[] };
        const approveJson = (await approveRes.json()) as { approvals?: Approval[] };
        if (cancelled) return;
        setStats({ ...EMPTY_STATS, ...statsJson, infraCost: statsJson.infraCost || 1700 });
        setWorkspaces(workJson.workspaces || []);
        setTiers(storeJson.tiers || []);
        setApprovals(approveJson.approvals || []);
        if (!(workJson.workspaces || []).length && !(approveJson.approvals || []).length) {
          setEmptyNote("No data yet - Real from Razorpay/E2E");
        }
      } catch {
        if (cancelled) return;
        setStats(EMPTY_STATS);
        setWorkspaces([]);
        setTiers([]);
        setApprovals([]);
        setEmptyNote("No data yet - Real from Razorpay/E2E");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-black px-6 py-8 text-white">
      <header className="flex items-center justify-between rounded-2xl border-2 border-[#FF3B30] px-5 py-4 shadow-[0_0_20px_#FF3B30]">
        <h1 className="text-2xl font-black text-[#FF3B30]">BHARATCLOUD SUPER ADMIN</h1>
        <Link href="/super-admin" className="text-sm text-[#00D4FF]">
          Command center
        </Link>
      </header>

      {loading ? <p className="mt-6 font-mono text-[#00FF88]">Loading real counts…</p> : null}
      {emptyNote ? <p className="mt-4 text-sm text-slate-400">{emptyNote}</p> : null}

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Card color="#00D4FF" label="WORKSPACES" value={String(stats.totalWorkspaces)} />
        <Card color="#FF9500" label="STORAGE" value={`${stats.storageUsed}GB`} />
        <Card color="#00FF88" label="INFRA COST" value={`Rs ${stats.infraCost} Fixed`} />
        <Card color="#FF3B30" label="GMAIL PENDING" value={String(stats.gmailPending)} />
        <Card color="#00D4FF" label="DRIVE PENDING" value={String(stats.drivePending)} />
        <Card color="#FF9500" label="BACKUPS" value={String(stats.backupCount)} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">All workspace members</h2>
        <ul className="mt-3 space-y-2">
          {workspaces.map((row) => (
            <li key={row.id} className="rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm">
              <span className="font-semibold">{row.name}</span>
              <span className="ml-3 text-slate-400">{row.email}</span>
              <span className="ml-3 text-[#00FF88]">{row.status}</span>
              <span className="ml-3">{row.plan}</span>
              <span className="ml-3 text-[#00D4FF]">{row.storage}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Storage tiers</h2>
        <div className="mt-3 grid gap-3">
          {tiers.map((tier) => (
            <article key={tier.name} className="rounded-xl border border-[#FF9500] bg-[#0A0A0A] p-4 shadow-[0_0_20px_#FF9500]">
              <p className="font-semibold">{tier.name}</p>
              <p className="mt-1 text-sm text-slate-300">
                {tier.used} / {tier.limit}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-[#00FF88]"
                  style={{
                    width: `${Math.min(100, (parseFloat(tier.used) / Math.max(parseFloat(tier.limit), 1)) * 100)}%`,
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Gmail and Drive approvals</h2>
        <ul className="mt-3 space-y-2">
          {approvals.map((row) => (
            <li key={`${row.type}-${row.user}`} className="rounded-xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm">
              <span className="font-semibold">{row.user}</span>
              <span className="ml-3 text-[#FF9500]">{row.type}</span>
              <span className="ml-3 text-[#FF3B30]">{row.status}</span>
              <span className="ml-3 text-slate-400">{row.date}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Card({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <article className="rounded-2xl border bg-[#0A0A0A] p-5" style={{ borderColor: color, boxShadow: `0 0 20px ${color}` }}>
      <p className="text-xs font-bold tracking-[0.16em]" style={{ color }}>
        {label}
      </p>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </article>
  );
}
