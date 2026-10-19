"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { formatInr, STORAGE_PLANS, type StoragePlanId } from "@/lib/config/pricing.config";
import { quoteUpgrade, UPGRADE_EXAMPLE } from "@/lib/config/upgrade.config";

export function PricingView() {
  const [fromId, setFromId] = useState<StoragePlanId>("100gb");
  const [toId, setToId] = useState<StoragePlanId>("300gb");
  const [daysUsed, setDaysUsed] = useState(90);

  const from = STORAGE_PLANS.find((plan) => plan.id === fromId) ?? STORAGE_PLANS[0];
  const to = STORAGE_PLANS.find((plan) => plan.id === toId) ?? STORAGE_PLANS[1];

  const live = useMemo(
    () => quoteUpgrade(from.yearlyInr, to.yearlyInr, daysUsed),
    [from.yearlyInr, to.yearlyInr, daysUsed],
  );

  return (
    <div className="min-h-screen bg-[#080808] px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-zinc-500 hover:text-white">
          BHARAT CLOUD.store
        </Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight">Pro-rata</h1>
        <p className="mt-4 text-zinc-400">
          Credit left on the current year is subtracted from the next yearly price. The ID cap does not rise until that difference is paid.
        </p>

        <div className="mt-8 rounded-[24px] border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Formula</p>
          <p className="saas-num mt-4 text-lg text-zinc-100">remaining = yearly − (yearly / 365 × daysUsed)</p>
          <p className="saas-num mt-2 text-lg text-zinc-100">pay = new − remaining</p>
          <p className="mt-6 text-sm text-zinc-400">
            Example: {UPGRADE_EXAMPLE.daysUsed} days used, remaining {formatInr(UPGRADE_EXAMPLE.remainingInr)}.{" "}
            {formatInr(UPGRADE_EXAMPLE.toYearlyInr)} − {formatInr(UPGRADE_EXAMPLE.remainingInr)} ={" "}
            {formatInr(UPGRADE_EXAMPLE.payInr)}.
          </p>
        </div>

        <div className="mt-4 rounded-[24px] border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-xs text-zinc-500">
              Current plan
              <select
                value={fromId}
                onChange={(event) => setFromId(event.target.value as StoragePlanId)}
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
              >
                {STORAGE_PLANS.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.storageLabel} · {formatInr(plan.yearlyInr)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-zinc-500">
              Next plan
              <select
                value={toId}
                onChange={(event) => setToId(event.target.value as StoragePlanId)}
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
              >
                {STORAGE_PLANS.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.storageLabel} · {formatInr(plan.yearlyInr)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-zinc-500">
              Days used
              <input
                type="number"
                min={0}
                max={365}
                value={daysUsed}
                onChange={(event) => setDaysUsed(Number(event.target.value) || 0)}
                className="saas-num mt-2 w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
              />
            </label>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-800 px-4 py-3">
              <p className="text-xs text-zinc-500">Remaining</p>
              <p className="saas-num mt-1 text-2xl">{formatInr(live.remainingInr)}</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 px-4 py-3">
              <p className="text-xs text-zinc-500">Pay</p>
              <p className="saas-num mt-1 text-2xl">{formatInr(live.payInr)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
