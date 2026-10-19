"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LiveStats = {
  tenants: number;
  tenantsActive: number;
  tenantsPending: number;
  storageUsed: number;
  storageLimit: number;
  saved: number;
  revenue: number;
  revenueToday: number;
  upi: number;
  upiFailed: number;
  gmail: number;
  gmailConnected: number;
  gmailQueue: number;
  members: number;
  admins: number;
  users: number;
  demo: boolean;
};

const DEMO: LiveStats = {
  tenants: 3,
  tenantsActive: 1,
  tenantsPending: 2,
  storageUsed: 42.5,
  storageLimit: 100,
  saved: 98.2,
  revenue: 38997,
  revenueToday: 0,
  upi: 3,
  upiFailed: 0,
  gmail: 0,
  gmailConnected: 0,
  gmailQueue: 0,
  members: 0,
  admins: 0,
  users: 0,
  demo: true,
};

const NAV = [
  { href: "/admin/members", label: "TENANTS" },
  { href: "/admin/super", label: "BILLING" },
  { href: "/admin/storage", label: "STORAGE" },
  { href: "/admin/payments", label: "PAYMENTS (UPI)" },
  { href: "/admin/gmail", label: "EMAIL (GMAIL)" },
  { href: "/admin/members", label: "MEMBERS" },
  { href: "/admin/recovery", label: "SECURITY" },
  { href: "/admin/super", label: "SYSTEM LOGS" },
  { href: "/admin", label: "SETTINGS" },
];

function inr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function SuperAdminGodPage() {
  const [stats, setStats] = useState<LiveStats>({
    ...DEMO,
    tenants: 0,
    tenantsActive: 0,
    tenantsPending: 0,
    storageUsed: 0,
    saved: 0,
    revenue: 0,
    upi: 0,
    demo: false,
  });
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const stamp = () => new Date().toISOString().slice(11, 19);
    setLogs([`${stamp()} GOD MODE online`, `${stamp()} infra floor locked at Rs1700`]);

    let cancelled = false;
    fetch("/api/admin/stats", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("stats unavailable");
        return res.json() as Promise<{
          companies?: number;
          revenue?: number;
          storageGb?: number;
          employees?: number;
        }>;
      })
      .then((data) => {
        if (cancelled) return;
        const tenants = Number(data.companies || 0);
        const storageUsed = Number(data.storageGb || 0);
        const revenue = Number(data.revenue || 0);
        const members = Number(data.employees || 0);
        if (tenants === 0 && storageUsed === 0 && revenue === 0) {
          setStats(DEMO);
          setLogs((prev) => [`${stamp()} Supabase empty — demo figures on`, ...prev]);
          return;
        }
        setStats({
          tenants,
          tenantsActive: tenants,
          tenantsPending: 0,
          storageUsed,
          storageLimit: Math.max(100, Math.ceil(storageUsed) || 100),
          saved: 0,
          revenue,
          revenueToday: 0,
          upi: 0,
          upiFailed: 0,
          gmail: 0,
          gmailConnected: 0,
          gmailQueue: 0,
          members,
          admins: 0,
          users: members,
          demo: false,
        });
        setLogs((prev) => [`${stamp()} Supabase stats loaded`, ...prev]);
      })
      .catch(() => {
        if (cancelled) return;
        setStats(DEMO);
        setLogs((prev) => [`${stamp()} Supabase failed — demo figures on`, ...prev]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hostingFixed = 1700;
  const e2eDynamic = Math.round(stats.storageUsed * 8);
  const infraCost = hostingFixed + e2eDynamic;
  const savedMoney = Math.max(0, 3700 - infraCost);
  const freeGb = Math.max(0, stats.storageLimit - stats.storageUsed);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">
        <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-[#0A0A0A] p-5">
          <p className="text-xs font-bold tracking-[0.2em] text-red-600">COMMAND CENTER</p>
          <nav className="mt-8 flex flex-1 flex-col gap-2 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg px-3 py-2 text-white hover:text-red-500"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="flex items-center gap-2 text-xs font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00FF88] shadow-[0_0_20px_#00FF88]" />
            SYSTEM ONLINE SECURE
          </p>
        </aside>

        <main className="min-w-0 flex-1 p-6 lg:p-8">
          <header className="flex items-start justify-between gap-4 rounded-2xl border-2 border-red-600 px-5 py-4 shadow-[0_0_20px_#dc2626]">
            <div>
              <h1 className="text-2xl font-black tracking-wide text-red-600 sm:text-3xl">
                BHARATCLOUD SUPER ADMIN
              </h1>
              <p className="mt-1 text-sm text-slate-400">INFRA COST {inr(infraCost)}</p>
            </div>
            <span className="rounded-full border border-red-600 px-3 py-1 text-xs font-bold text-red-500 shadow-[0_0_20px_#dc2626]">
              GOD MODE UNLOCKED
            </span>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card color="#FF0000" label="REVENUE" value={inr(stats.revenue)} lines={[`TODAY ${inr(stats.revenueToday)}`, `MTD ${inr(stats.revenue)}`]} />
            <Card color="#00A8FF" label="TENANTS" value={String(stats.tenants)} lines={[`ACTIVE ${stats.tenantsActive}`, `PENDING ${stats.tenantsPending}`]} />
            <Card
              color="#A855F7"
              label="STORAGE"
              value={`${stats.storageUsed}/${stats.storageLimit}GB`}
              lines={[`USED ${stats.storageUsed}GB`, `FREE ${freeGb}GB`, `SAVED ${stats.saved}GB`]}
            />
            <Card color="#00FF88" label="UPI" value={String(stats.upi)} lines={[`TRANSACTIONS ${stats.upi}`, `FAILED ${stats.upiFailed}`]} />
            <Card color="#FF8C00" label="GMAIL" value={String(stats.gmail)} lines={[`LOCKED ${stats.gmail}`, `CONNECTED ${stats.gmailConnected}`, `QUEUE ${stats.gmailQueue}`]} />
            <Card color="#00E5FF" label="MEMBERS" value={String(stats.members)} lines={[`ADMINS ${stats.admins}`, `USERS ${stats.users}`]} />
          </section>

          <section className="mt-6 rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 shadow-[0_0_20px_#dc2626]">
            <p className="text-sm text-slate-300">
              Hosting {inr(hostingFixed)} Fixed + E2E {inr(e2eDynamic)} Cool (HOT Rs20 COLD Rs6 avg Rs8) = Total {inr(infraCost)}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Old <span className="line-through">₹3,700</span>
            </p>
            <p className="mt-3 inline-flex rounded-full bg-[#00FF88] px-3 py-1 text-xs font-black text-black shadow-[0_0_20px_#00FF88]">
              YOU SAVED {inr(savedMoney)} COOL ACHIEVER
            </p>
            <p className="mt-4 text-sm text-slate-300">
              Upload Achiever: Stored {stats.storageUsed}GB → Saved {stats.saved}GB
            </p>
          </section>

          <section className="mt-6 rounded-2xl border border-emerald-500/30 bg-black p-4 font-mono text-sm text-[#00FF88] shadow-[0_0_20px_#00FF88]">
            {logs.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>{new Date().toISOString().slice(11, 19)} infra {inr(infraCost)} = {hostingFixed} + {e2eDynamic}</p>
          </section>
        </main>
      </div>
    </div>
  );
}

function Card({
  color,
  label,
  value,
  lines,
}: {
  color: string;
  label: string;
  value: string;
  lines: string[];
}) {
  return (
    <article
      className="rounded-2xl border bg-[#0A0A0A] p-5"
      style={{ borderColor: color, boxShadow: `0 0 20px ${color}` }}
    >
      <p className="text-xs font-bold tracking-[0.18em]" style={{ color }}>
        {label}
      </p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <div className="mt-3 space-y-1 text-sm text-slate-300">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </article>
  );
}
