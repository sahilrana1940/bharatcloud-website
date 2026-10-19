import Link from "next/link";

import { STORAGE_PLANS, formatInr } from "@/lib/config/pricing.config";

export function LandingView() {
  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#10243E]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-wide">BharatCloud</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/pricing" className="text-slate-600 hover:text-[#10243E]">
            Pricing
          </Link>
          <Link href="/login" className="rounded-full bg-[#10243E] px-4 py-2 font-semibold text-white">
            Sign in
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0F766E]">
          Mumbai E2E Only
        </p>
        <h1 className="mt-4 max-w-xl text-5xl font-semibold tracking-tight sm:text-6xl">
          Mumbai me safe hai
        </h1>
        <p className="mt-4 max-w-lg text-slate-600">
          Yearly archive on E2E Mumbai. Pay with Paytm. Site stays on Hostinger.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {STORAGE_PLANS.map((plan) => {
            const popular = plan.yearlyInr === 12999;
            return (
              <article
                key={plan.id}
                className={`relative rounded-2xl border bg-white p-6 shadow-sm ${
                  popular ? "border-[#00BAF2]" : "border-slate-200"
                }`}
              >
                {popular ? (
                  <span className="absolute -top-3 right-4 rounded-full bg-[#00BAF2] px-3 py-1 text-xs font-bold text-[#062033]">
                    Popular
                  </span>
                ) : null}
                <p className="text-sm font-semibold text-slate-500">{plan.label}</p>
                <p className="mt-3 text-3xl font-semibold">{formatInr(plan.yearlyInr)}</p>
                <p className="mt-1 text-sm text-slate-500">per year · {plan.storageLabel}</p>
                <Link
                  href="/pricing"
                  className="mt-6 inline-flex rounded-xl bg-[#10243E] px-4 py-2 text-sm font-semibold text-white"
                >
                  View plan
                </Link>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
