"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SUPER_ADMIN_EMAIL = "support@bharatcloud.store";

const NAV = [
  { href: "/super-admin", label: "Overview" },
  { href: "/super-admin/infrastructure", label: "Infrastructure" },
  { href: "/super-admin/infrastructure#storage", label: "Storage" },
  { href: "/super-admin/infrastructure#networking", label: "Networking" },
  { href: "/super-admin/infrastructure#compute", label: "Compute" },
  { href: "/super-admin/high-command", label: "Security" },
  { href: "/super-admin/billing", label: "Billing" },
  { href: "/super-admin/users", label: "Settings" },
  { href: "/super-admin/logs", label: "Logs" },
  { href: "/super-admin/high-command", label: "Admin Employees" },
];

export function istNow() {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function useIstClock() {
  const [time, setTime] = useState("--:--");
  useEffect(() => {
    const tick = () => setTime(istNow());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export async function postFix(type: string) {
  const res = await fetch("/api/super-admin/fix", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-admin-email": SUPER_ADMIN_EMAIL,
    },
    body: JSON.stringify({ type }),
  });
  const data = await res.json();
  if (res.status === 403) return "403 Forbidden";
  return String(data.message || "Request failed");
}

export function BugFixPanel({
  buttons,
  accent = "teal",
}: {
  buttons: { label: string; type: string }[];
  accent?: "teal" | "green";
}) {
  const [result, setResult] = useState("");
  const [running, setRunning] = useState("");

  return (
    <section className="rounded-xl border border-zinc-800 bg-[#111113] p-5">
      <h2 className="text-sm font-semibold text-white">Bug Fix Panel</h2>
      <p className="mt-1 text-xs text-zinc-500">Only {SUPER_ADMIN_EMAIL} can run these.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            disabled={running === button.type}
            onClick={async () => {
              setRunning(button.type);
              setResult(await postFix(button.type));
              setRunning("");
            }}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
              accent === "green"
                ? "border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-black"
                : "border-teal-700 text-teal-300 hover:bg-[#115e59] hover:text-white"
            } disabled:opacity-50`}
          >
            {running === button.type ? "Running…" : button.label}
          </button>
        ))}
      </div>
      {result ? <p className="mt-3 text-sm text-emerald-300">{result}</p> : null}
    </section>
  );
}

export function AdminShell({
  active,
  children,
  military = false,
}: {
  active: string;
  children: React.ReactNode;
  military?: boolean;
}) {
  const time = useIstClock();

  return (
    <div className={`min-h-screen ${military ? "bg-[#050507] text-[#d1fae5]" : "bg-[#050507] text-zinc-100"}`}>
      <div className="flex min-h-screen">
        <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-[#09090b] px-4 py-6">
          <p className="px-2 text-[11px] font-semibold tracking-[0.22em] text-zinc-500">COMMAND CENTER</p>
          <nav className="mt-6 flex flex-col gap-1">
            {NAV.map((item) => {
              const on = item.label === active;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    on ? "bg-[#115e59] text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <form action="/api/auth/logout" method="post" className="mt-4">
            <button type="submit" className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white hover:text-black">
              Log out
            </button>
          </form>
          <div className="mt-4 rounded-xl border border-zinc-800 px-3 py-3">
            <p className="text-xs text-zinc-500">Super Admin</p>
            <p className="text-sm text-white">admin@bharatcloud.in</p>
            <span className="mt-2 inline-flex rounded-full bg-[#115e59] px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
              SA
            </span>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 md:px-10">
            <p className="text-sm font-semibold text-white">BharatCloud Super Admin</p>
            <div className="flex items-center gap-3">
              <p className="text-xs text-emerald-400">Live • IST {time}</p>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white hover:text-black">
                  Log out
                </button>
              </form>
            </div>
          </header>
          <main className="px-6 py-8 md:px-10">{children}</main>
          <footer className="border-t border-zinc-800 px-6 py-4 text-center text-[11px] tracking-wide text-zinc-500 md:px-10">
            Build safe · Build real
          </footer>
        </div>
      </div>
    </div>
  );
}

export const FIX_BUTTONS = [
  { label: "Clear Logs", type: "LOGS" },
  { label: "Clear Cache", type: "CACHE" },
  { label: "Fix Storage", type: "STORAGE" },
  { label: "Recalc Infra", type: "INFRA" },
];
