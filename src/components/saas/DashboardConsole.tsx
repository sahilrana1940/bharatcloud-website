"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  HardDrive,
  LayoutDashboard,
  Plus,
  ScanLine,
  Users,
  X,
} from "lucide-react";

import { formatInr, isIdCapReached, planById } from "@/lib/config/pricing.config";
import { fiveIdRentQuote, RENT_LOCKS_SAFE } from "@/lib/config/rent.config";
import {
  forwardPendingInr,
  GODADDY_SCAN,
  RENT_LOCKS,
  unregisteredSeats,
} from "@/lib/config/scan.config";
import { UPGRADE_EXAMPLE } from "@/lib/config/upgrade.config";

const PLAN = planById("100gb");
const RENT_QUOTE = fiveIdRentQuote();
const PENDING = forwardPendingInr();

const MAILBOXES = [
  { email: "admin@bharatcloud.store", role: "Admin", status: "Active", sync: "Live" },
  { email: "ops@bharatcloud.store", role: "Employee", status: "Active", sync: "Live" },
  { email: "accounts@bharatcloud.store", role: "Employee", status: "Active", sync: "2m" },
  { email: "hr@bharatcloud.store", role: "Employee", status: "Active", sync: "Live" },
  { email: "desk@bharatcloud.store", role: "Employee", status: "Active", sync: "6m" },
];

const SCAN_LOG = [
  "GoDaddy scan finished. 6 active mailboxes found.",
  "2 registered on the 100GB plan. 4 seats unregistered.",
  `Forward block pending ${formatInr(PENDING)}.`,
  "Coverage 83%. Threshold failed.",
];

export function DashboardConsole() {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const activeIds = MAILBOXES.length;
  const blocked = isIdCapReached(activeIds, PLAN.id);

  function onAddId() {
    if (blocked) setUpgradeOpen(true);
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/80 px-5 py-6 md:flex">
          <Link href="/" className="text-sm font-medium tracking-tight">
            BHARAT CLOUD<span className="text-zinc-500">.store</span>
          </Link>
          <p className="mt-1 text-xs text-zinc-500">Mumbai E2E</p>
          <nav className="mt-10 space-y-1 text-sm">
            <SideLink icon={LayoutDashboard} label="Overview" active />
            <SideLink icon={Users} label="Mailboxes" />
            <SideLink icon={HardDrive} label="Rent" />
            <SideLink icon={ScanLine} label="Scan" />
          </nav>
          <div className="mt-auto rounded-[24px] border border-zinc-800 bg-zinc-900/50 p-4 text-xs text-zinc-400 backdrop-blur">
            <p>Plan {PLAN.storageLabel}</p>
            <p className="saas-num mt-1 text-white">
              {activeIds}/{PLAN.maxIds} IDs
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Workspace</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Mailboxes</h1>
            </div>
            <button
              type="button"
              onClick={onAddId}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black"
            >
              <Plus className="h-4 w-4" />
              Add ID
            </button>
          </div>

          <button
            type="button"
            onClick={() => setForwardOpen(true)}
            className="mt-6 flex w-full items-start gap-3 rounded-[24px] border border-red-900/80 bg-red-950/40 px-5 py-4 text-left backdrop-blur"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <span>
              <span className="block text-sm font-medium text-red-200">
                {GODADDY_SCAN.activeFound} Active · {GODADDY_SCAN.coveragePct}% FAILED
              </span>
              <span className="mt-1 block text-xs text-red-200/70">
                GoDaddy scan found seats outside the plan. Forward is blocked until the pending invoice is cleared.
              </span>
            </span>
          </button>

          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Active IDs" value={`${activeIds}/${PLAN.maxIds}`} />
            <Metric label="Coverage" value={`${GODADDY_SCAN.coveragePct}%`} danger bar={GODADDY_SCAN.coveragePct} />
            <Metric label="Rent due" value={`${formatInr(RENT_QUOTE.monthlyInr)}/mo`} />
            <Metric label="Forward" value="Pending" hint={formatInr(PENDING)} />
          </section>

          <section className="mt-4 overflow-x-auto rounded-[24px] border border-zinc-800 bg-zinc-900/50 backdrop-blur">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Email</th>
                  <th className="px-5 py-4 font-medium">Role</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Sync</th>
                </tr>
              </thead>
              <tbody>
                {MAILBOXES.map((row) => (
                  <tr key={row.email} className="border-t border-zinc-800">
                    <td className="px-5 py-4">{row.email}</td>
                    <td className="px-5 py-4 text-zinc-300">{row.role}</td>
                    <td className="px-5 py-4 text-zinc-300">{row.status}</td>
                    <td className="saas-num px-5 py-4 text-zinc-300">{row.sync}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
              <h2 className="text-sm font-medium">Rent timeline</h2>
              <ol className="mt-5 space-y-4 text-sm">
                <li className="flex justify-between gap-4 border-b border-zinc-800 pb-3">
                  <span className="text-zinc-400">Day 0</span>
                  <span>Backup on · storage live</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-zinc-800 pb-3">
                  <span className="text-zinc-400">{RENT_LOCKS.pause.afterDays}d</span>
                  <span>
                    {RENT_LOCKS.pause.label} · backup {RENT_LOCKS.pause.backup} · storage {RENT_LOCKS.pause.storage}
                  </span>
                </li>
                <li className="flex justify-between gap-4">
                  <span className="text-zinc-400">{RENT_LOCKS.readOnly.afterDays}d</span>
                  <span>{RENT_LOCKS.readOnly.access}</span>
                </li>
              </ol>
              <p className="mt-4 text-xs text-zinc-500">{RENT_LOCKS_SAFE}</p>
            </div>
            <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
              <h2 className="text-sm font-medium">Scan log</h2>
              <ul className="saas-num mt-5 space-y-3 text-xs leading-5 text-zinc-300">
                {SCAN_LOG.map((line) => (
                  <li key={line} className="border-b border-zinc-800 pb-3 last:border-0">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>
      </div>

      {upgradeOpen && (
        <Modal title="Upgrade required" onClose={() => setUpgradeOpen(false)}>
          <p className="text-sm text-zinc-400">
            {PLAN.storageLabel} is fixed at {PLAN.maxIds} IDs. Seat {PLAN.maxIds + 1} stays blocked until you move to{" "}
            {UPGRADE_EXAMPLE.toPlanLabel}.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Metric label="Remaining" value={formatInr(UPGRADE_EXAMPLE.remainingInr)} />
            <Metric label="Pay" value={formatInr(UPGRADE_EXAMPLE.payInr)} />
          </div>
          <p className="saas-num mt-4 text-xs text-zinc-500">
            {UPGRADE_EXAMPLE.daysUsed}d used · {formatInr(UPGRADE_EXAMPLE.toYearlyInr)} −{" "}
            {formatInr(UPGRADE_EXAMPLE.remainingInr)} = {formatInr(UPGRADE_EXAMPLE.payInr)}
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-black"
          >
            Review pro-rata
          </Link>
        </Modal>
      )}

      {forwardOpen && (
        <Modal title="Forward block" onClose={() => setForwardOpen(false)}>
          <p className="text-sm text-zinc-400">
            Pending = (found − registered) × {formatInr(GODADDY_SCAN.forwardRateInr)} × months.
          </p>
          <p className="saas-num mt-4 text-3xl">
            {formatInr(PENDING)}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            ({GODADDY_SCAN.activeFound} − {GODADDY_SCAN.registered}) × {GODADDY_SCAN.forwardRateInr} ×{" "}
            {GODADDY_SCAN.pendingMonths} = {PENDING}. {unregisteredSeats()} seats are outside the plan.
          </p>
        </Modal>
      )}
    </div>
  );
}

function SideLink({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
        active ? "bg-white text-black" : "text-zinc-400"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  danger,
  bar,
}: {
  label: string;
  value: string;
  hint?: string;
  danger?: boolean;
  bar?: number;
}) {
  return (
    <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`saas-num mt-2 text-2xl ${danger ? "text-red-400" : ""}`}>{value}</p>
      {hint ? <p className="saas-num mt-1 text-xs text-zinc-500">{hint}</p> : null}
      {typeof bar === "number" ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-red-500" style={{ width: `${bar}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[24px] border border-zinc-800 bg-[#0c0c0c] p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-zinc-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
