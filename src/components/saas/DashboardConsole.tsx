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
import { coveragePercent, isAppLive } from "@/lib/config/live";
import { UPGRADE_EXAMPLE } from "@/lib/config/upgrade.config";

const IS_LIVE = isAppLive();
const PAYTM_LIVE_UPI =
  process.env.NEXT_PUBLIC_BILLING_UPI_VPA?.trim() ||
  process.env.NEXT_PUBLIC_PAYTM_UPI_ID?.trim() ||
  "9469276461@idfcfirst";

const PLAN = planById("100gb") ?? {
  id: "100gb",
  name: "Starter",
  yearlyInr: 5999,
  storage: "100GB",
  storageLabel: "100GB Total Storage",
  maxIds: 5,
  label: "5 Users (Manual Approval)",
};
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
  "Hostinger mailbox scan finished. 6 active mailboxes found.",
  "2 registered on the 100GB plan. 4 seats unregistered.",
  `Forward block pending ${formatInr(PENDING)}.`,
  "Coverage 83%. Threshold failed.",
];

export function DashboardConsole() {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const activeIds = MAILBOXES.length;
  const blocked = isIdCapReached(activeIds, PLAN.maxIds);
  const coverage = coveragePercent(activeIds, PLAN.maxIds);
  const coverageOk = coverage >= 100;

  function onAddId() {
    if (blocked) setUpgradeOpen(true);
  }

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#10243E]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 flex-col bg-[#10243E] px-5 py-6 text-white md:flex">
          <Link href="/" className="text-sm font-medium tracking-tight">
            BHARAT CLOUD<span className="text-[#00BAF2]">.store</span>
          </Link>
          <p className="mt-1 text-xs text-[#7DD3C7]">Hostinger · E2E Mumbai</p>
          <nav className="mt-10 space-y-1 text-sm">
            <SideLink icon={LayoutDashboard} label="Overview" active />
            <SideLink icon={Users} label="Mailboxes" />
            <SideLink icon={HardDrive} label="Rent" />
            <SideLink icon={ScanLine} label="Scan" />
          </nav>
          <div className="mt-auto rounded-[24px] border border-white/10 bg-white/10 p-4 text-xs text-white/70">
            <p>Plan {PLAN.storageLabel}</p>
            <p className="saas-num mt-1 text-white">
              {activeIds}/{PLAN.maxIds} IDs
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#0F766E]">Workspace</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Mailboxes</h1>
            </div>
            <button
              type="button"
              onClick={onAddId}
              className="inline-flex items-center gap-2 rounded-full bg-[#00BAF2] px-4 py-2 text-sm font-medium text-[#062033]"
            >
              <Plus className="h-4 w-4" />
              Add ID
            </button>
          </div>

          {!IS_LIVE && (
            <button
              type="button"
              onClick={() => setForwardOpen(true)}
              className="mt-6 flex w-full items-start gap-3 rounded-[24px] border border-red-200 bg-white px-5 py-4 text-left shadow-sm"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>
                <span className="block text-sm font-medium text-red-700">
                  {GODADDY_SCAN.activeFound} Active · {GODADDY_SCAN.coveragePct}% FAILED
                </span>
                <span className="mt-1 block text-xs text-red-700/80">
                  Hostinger scan found seats outside the plan. Storage stays on E2E. Pay the pending amount in Paytm.
                </span>
              </span>
            </button>
          )}

          {IS_LIVE && (
            <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
              <p className="font-medium">Coverage 100% · Plan active on Hostinger · E2E Mumbai archive</p>
              <p className="mt-1 text-xs text-emerald-800/90">
                Pay rent via Paytm {PAYTM_LIVE_UPI} — live UPI, no rehearsal banners.
              </p>
            </div>
          )}

          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Active IDs" value={`${Math.min(activeIds, PLAN.maxIds)}/${PLAN.maxIds}`} />
            <Metric
              label="Coverage"
              value={`${coverage}%`}
              success={coverageOk}
              danger={!coverageOk}
              bar={coverage}
              barSuccess={coverageOk}
            />
            <Metric label="Rent due" value={`${formatInr(RENT_QUOTE.monthlyInr)}/mo`} hint={IS_LIVE ? `Paytm ${PAYTM_LIVE_UPI}` : undefined} />
            {!IS_LIVE ? (
              <Metric label="Forward" value="Pending" hint={formatInr(PENDING)} />
            ) : (
              <Metric label="Billing" value="Paytm LIVE" hint={PAYTM_LIVE_UPI} success />
            )}
          </section>

          <section className="mt-4 overflow-x-auto rounded-[24px] border border-[#10243E]/10 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[#F4EFE6] text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-medium">Email</th>
                  <th className="px-5 py-4 font-medium">Role</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Sync</th>
                </tr>
              </thead>
              <tbody>
                {MAILBOXES.map((row) => (
                  <tr key={row.email} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-medium">{row.email}</td>
                    <td className="px-5 py-4 text-slate-600">{row.role}</td>
                    <td className="px-5 py-4 text-slate-600">{row.status}</td>
                    <td className="saas-num px-5 py-4 text-slate-600">{row.sync}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-[#10243E]/10 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium">Rent timeline</h2>
              <ol className="mt-5 space-y-4 text-sm">
                <li className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">Day 0</span>
                  <span>Backup on · E2E storage live</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <span className="text-slate-500">{RENT_LOCKS.pause.afterDays}d</span>
                  <span>
                    {RENT_LOCKS.pause.label} · backup {RENT_LOCKS.pause.backup} · storage {RENT_LOCKS.pause.storage}
                  </span>
                </li>
                <li className="flex justify-between gap-4">
                  <span className="text-slate-500">{RENT_LOCKS.readOnly.afterDays}d</span>
                  <span>{RENT_LOCKS.readOnly.access}</span>
                </li>
              </ol>
              <ul className="mt-4 space-y-1 text-xs text-slate-500">
                <li>{RENT_LOCKS_SAFE.day0_7}</li>
                <li>{RENT_LOCKS_SAFE.day7_30}</li>
                <li>{RENT_LOCKS_SAFE.day30_90}</li>
                <li>Files stay on E2E Mumbai. Site stays on Hostinger. Paytm only.</li>
              </ul>
            </div>
            <div className="rounded-[24px] border border-[#10243E]/10 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-medium">{IS_LIVE ? "Status" : "Scan log"}</h2>
              <ul className="saas-num mt-5 space-y-3 text-xs leading-5 text-slate-600">
                {(IS_LIVE
                  ? [
                      "All plan IDs registered on Hostinger.",
                      `Coverage ${coverage}% — within ${PLAN.maxIds} ID limit.`,
                      `Rent: Pay via Paytm ${PAYTM_LIVE_UPI}.`,
                      "Archive storage on E2E Mumbai (bharatcloudfinal2).",
                    ]
                  : SCAN_LOG
                ).map((line) => (
                  <li key={line} className="border-b border-slate-100 pb-3 last:border-0">
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
          <p className="text-sm text-slate-600">
            {PLAN.storageLabel} is fixed at {PLAN.maxIds} IDs. Seat {PLAN.maxIds + 1} stays blocked until you move to{" "}
            {UPGRADE_EXAMPLE.toPlanLabel}. Pay the difference in Paytm.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Metric label="Remaining" value={formatInr(UPGRADE_EXAMPLE.remainingInr)} />
            <Metric label="Pay" value={formatInr(UPGRADE_EXAMPLE.payInr)} />
          </div>
          <p className="saas-num mt-4 text-xs text-slate-500">
            {UPGRADE_EXAMPLE.daysUsed}d used · {formatInr(UPGRADE_EXAMPLE.toYearlyInr)} −{" "}
            {formatInr(UPGRADE_EXAMPLE.remainingInr)} = {formatInr(UPGRADE_EXAMPLE.payInr)}
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex rounded-full bg-[#00BAF2] px-4 py-2 text-sm font-medium text-[#062033]"
          >
            Review pro-rata
          </Link>
        </Modal>
      )}

      {forwardOpen && (
        <Modal title="Forward block" onClose={() => setForwardOpen(false)}>
          <p className="text-sm text-slate-600">
            Pending = (found − registered) × {formatInr(GODADDY_SCAN.forwardRateInr)} × months. Collect it in Paytm.
          </p>
          <p className="saas-num mt-4 text-3xl">
            {formatInr(PENDING)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
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
        active ? "bg-[#00BAF2] text-[#062033]" : "text-white/70"
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
  success,
  bar,
  barSuccess,
}: {
  label: string;
  value: string;
  hint?: string;
  danger?: boolean;
  success?: boolean;
  bar?: number;
  barSuccess?: boolean;
}) {
  const valueClass = success ? "text-emerald-600" : danger ? "text-red-600" : "text-[#10243E]";
  const barColor = barSuccess || success ? "bg-emerald-500" : "bg-red-500";
  return (
    <div className="rounded-[24px] border border-[#10243E]/10 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`saas-num mt-2 text-2xl ${valueClass}`}>{value}</p>
      {hint ? <p className="saas-num mt-1 text-xs text-slate-500">{hint}</p> : null}
      {typeof bar === "number" ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${bar}%` }} />
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
      <div className="w-full max-w-md rounded-[24px] border border-[#10243E]/10 bg-white p-6 text-[#10243E] shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
