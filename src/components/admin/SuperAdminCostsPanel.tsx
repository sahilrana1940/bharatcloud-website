"use client";

import { useEffect, useState } from "react";
import { Calendar, IndianRupee, Wallet } from "lucide-react";

import {
  monthlyTotalInr,
  nextDueDate,
  PLATFORM_COST_LINES,
} from "@/lib/admin/platform-costs";

function formatInr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function SuperAdminCostsPanel() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [configured, setConfigured] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/super/me", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.email) setSessionEmail(j.email);
        if (j.configuredSuperAdmins) setConfigured(j.configuredSuperAdmins);
      })
      .catch(() => undefined);
  }, []);

  const total = monthlyTotalInr();
  const now = new Date();
  const upcoming = [...PLATFORM_COST_LINES]
    .filter((l) => l.amountInr > 0)
    .map((l) => ({ ...l, due: nextDueDate(l.dueDayOfMonth, now) }))
    .sort((a, b) => a.due.getTime() - b.due.getTime());

  return (
    <section className="pro-glass mt-8 rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Wallet className="h-5 w-5 text-cyan-600" />
            Platform hosting kharcha (monthly)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Estimated infra bills — update amounts in{" "}
            <code className="text-xs">src/lib/admin/platform-costs.ts</code> when invoices arrive.
          </p>
        </div>
        <div className="rounded-xl bg-cyan-50 px-4 py-3 text-right ring-1 ring-cyan-100">
          <p className="text-xs font-semibold uppercase text-cyan-800">Approx / month</p>
          <p className="text-2xl font-bold text-slate-900">{formatInr(total)}</p>
        </div>
      </div>

      {sessionEmail && (
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Logged in as <strong>{sessionEmail}</strong>
          {configured.includes(sessionEmail) ? (
            <span className="text-emerald-600"> · Super admin (code config)</span>
          ) : (
            <span className="text-amber-600"> · Not in default super-admin list</span>
          )}
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="py-2 pr-4">Vendor</th>
              <th className="py-2 pr-4">Purpose</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2">Next due</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((row) => (
              <tr key={row.vendor} className="border-b border-slate-100">
                <td className="py-3 pr-4 font-medium text-slate-800">
                  {row.billingUrl ? (
                    <a href={row.billingUrl} className="text-cyan-700 hover:underline" target="_blank" rel="noreferrer">
                      {row.vendor}
                    </a>
                  ) : (
                    row.vendor
                  )}
                </td>
                <td className="py-3 pr-4 text-slate-600">{row.purpose}</td>
                <td className="py-3 pr-4 font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <IndianRupee className="h-3.5 w-3.5" />
                    {row.amountInr.toLocaleString("en-IN")}
                  </span>
                </td>
                <td className="py-3 text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(row.due)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Configured super-admin emails in code: {configured.join(", ") || "—"}
      </p>
    </section>
  );
}
