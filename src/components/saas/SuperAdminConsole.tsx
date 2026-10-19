"use client";

import { useState } from "react";
import Link from "next/link";

import { runAutoFix, type FixCommand, type FixLogLine } from "@/lib/actions/autoFix";
import { formatInr, STORAGE_PLANS } from "@/lib/config/pricing.config";
import { RENT } from "@/lib/config/rent.config";
import { forwardPendingInr, GODADDY_SCAN } from "@/lib/config/scan.config";
import { UPGRADE_EXAMPLE } from "@/lib/config/upgrade.config";

const TENANTS = [
  {
    id: "bharat-tijori",
    tenant: "Bharat Tijori",
    plan: "100GB",
    ids: "5/5",
    rent: formatInr(395),
    issue: "Forward block",
    badge: "Pending",
  },
  {
    id: "west-dock",
    tenant: "West Dock Logistics",
    plan: "300GB",
    ids: "11/20",
    rent: formatInr(199 + 10 * 49),
    issue: "Rent day 8",
    badge: "Pause",
  },
  {
    id: "north-mill",
    tenant: "North Mill",
    plan: "1TB",
    ids: "22/50",
    rent: formatInr(199 + 21 * 99),
    issue: "None",
    badge: "Clear",
  },
];

const COMMANDS: { id: FixCommand; label: string }[] = [
  { id: "FIX_FORWARD", label: "FIX FORWARD" },
  { id: "COLLECT_RENT", label: "COLLECT RENT" },
  { id: "FORCE_UPGRADE", label: "FORCE UPGRADE" },
  { id: "RESCAN", label: "RE-SCAN" },
];

export function SuperAdminConsole() {
  const [tenantId, setTenantId] = useState(TENANTS[0].id);
  const [log, setLog] = useState<FixLogLine[]>([]);

  function run(command: FixCommand) {
    const tenant = TENANTS.find((row) => row.id === tenantId) ?? TENANTS[0];
    setLog((prev) => [runAutoFix(command, tenant.tenant), ...prev].slice(0, 12));
  }

  return (
    <div className="min-h-screen bg-[#080808] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">SUPER ADMIN</p>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
              Auto-Detect
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1 text-xs font-normal text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Live
              </span>
            </h1>
          </div>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
            Open dashboard
          </Link>
        </header>

        <section className="mt-8 overflow-x-auto rounded-[24px] border border-zinc-800 bg-zinc-900/50 backdrop-blur">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="px-5 py-4 font-medium">Tenant</th>
                <th className="px-5 py-4 font-medium">Plan</th>
                <th className="px-5 py-4 font-medium">IDs</th>
                <th className="px-5 py-4 font-medium">Rent</th>
                <th className="px-5 py-4 font-medium">Issue</th>
                <th className="px-5 py-4 font-medium">Badge</th>
              </tr>
            </thead>
            <tbody>
              {TENANTS.map((row) => {
                const selected = row.id === tenantId;
                return (
                  <tr
                    key={row.id}
                    onClick={() => setTenantId(row.id)}
                    className={`cursor-pointer border-t border-zinc-800 ${selected ? "bg-white/5" : ""}`}
                  >
                    <td className="px-5 py-4">{row.tenant}</td>
                    <td className="px-5 py-4 text-zinc-300">{row.plan}</td>
                    <td className="saas-num px-5 py-4">{row.ids}</td>
                    <td className="saas-num px-5 py-4">{row.rent}</td>
                    <td className="px-5 py-4 text-zinc-300">{row.issue}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs">{row.badge}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <div className="mt-4 flex flex-wrap gap-2">
          {COMMANDS.map((command) => (
            <button
              key={command.id}
              type="button"
              onClick={() => run(command.id)}
              className="rounded-full bg-white px-4 py-2 text-xs font-medium tracking-wide text-black"
            >
              {command.label}
            </button>
          ))}
        </div>

        <section className="mt-4 rounded-[24px] border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Log</p>
          <div className="saas-num mt-3 min-h-32 space-y-2 text-xs text-emerald-300">
            {log.length === 0 ? <p className="text-zinc-600">Waiting for a fix command.</p> : null}
            {log.map((line) => (
              <p key={line.id}>
                {line.at} {line.command} {line.result}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ConfigChip
            file="pricing.config.ts"
            value={STORAGE_PLANS.map((plan) => `${plan.yearlyInr}/${plan.maxIds}`).join(" · ")}
          />
          <ConfigChip
            file="rent.config.ts"
            value={`${RENT.adminMonthlyInr} + ${RENT.employeeFirst30DaysInr}/${RENT.employeeAfter30DaysInr}`}
          />
          <ConfigChip
            file="upgrade.config.ts"
            value={`${UPGRADE_EXAMPLE.remainingInr} → ${UPGRADE_EXAMPLE.payInr}`}
          />
          <ConfigChip
            file="scan.config.ts"
            value={`${GODADDY_SCAN.activeFound} found · pending ${forwardPendingInr()}`}
          />
        </section>
      </div>
    </div>
  );
}

function ConfigChip({ file, value }: { file: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur">
      <p className="text-xs text-zinc-500">{file}</p>
      <p className="saas-num mt-2 text-sm text-zinc-200">{value}</p>
    </div>
  );
}
