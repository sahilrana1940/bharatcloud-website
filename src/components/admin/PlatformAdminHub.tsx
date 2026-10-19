"use client";

import Link from "next/link";

const METRICS = [
  { label: "UPI earned", value: "0" },
  { label: "UPI this month", value: "0" },
  { label: "Infra cost", value: "0" },
  { label: "Net", value: "0" },
  { label: "Tenants paid", value: "0" },
  { label: "Tenants due", value: "0" },
  { label: "Pending UPI", value: "No pending" },
  { label: "Pending tickets", value: "No open" },
  { label: "Gmail", value: "Connected" },
  { label: "Storage", value: "0/100" },
  { label: "Members", value: "0" },
];

export function PlatformAdminHub() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Super admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#10243E]">Platform</h1>
        <p className="mt-2 text-sm text-slate-600">No tenants loaded. Mumbai E2E. Paytm only.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-[#10243E]">{item.value}</p>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/payments" className="rounded-xl bg-[#00BAF2] px-4 py-2.5 text-sm font-bold text-[#062033]">
          UPI queue
        </Link>
        <Link href="/admin/members" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800">
          Members
        </Link>
        <Link href="/admin/gmail" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800">
          Gmail
        </Link>
      </div>
    </div>
  );
}
