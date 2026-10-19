"use client";

import Link from "next/link";

const CARDS = [
  { label: "Team members", value: "0", hint: "No members yet" },
  { label: "Drive", value: "0.0 GB", hint: "No files" },
  { label: "B3", value: "0 GB", hint: "No bucket" },
  { label: "Billing", value: "None", hint: "No active plan" },
];

export function OwnerDashboardClient() {
  return (
    <div className="px-4 py-8 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0F766E]">Company owner</p>
      <h1 className="mt-2 text-3xl font-semibold text-[#10243E]">company@bharatcloud.store</h1>
      <p className="mt-2 text-sm text-slate-600">Empty workspace. Mumbai E2E storage. Paytm billing.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-3 text-2xl font-semibold text-[#10243E]">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.hint}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard/team" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          Team
        </Link>
        <Link href="/dashboard/billing" className="rounded-xl bg-[#00BAF2] px-4 py-2 text-sm font-bold text-[#062033]">
          Billing
        </Link>
      </div>
    </div>
  );
}
