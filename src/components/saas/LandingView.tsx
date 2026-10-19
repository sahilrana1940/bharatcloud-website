import Link from "next/link";
import { ArrowUpRight, Clock3, HardDrive, MapPin, Shield } from "lucide-react";

import {
  formatInr,
  STORAGE_PLANS,
  type StoragePlan,
} from "@/lib/config/pricing.config";
import { fiveIdRentQuote, RENT } from "@/lib/config/rent.config";
import { OFFER_DAYS_LEFT } from "@/lib/config/upgrade.config";

const quote = fiveIdRentQuote();

export function LandingView() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 text-xs font-semibold tracking-wide">
            BC
          </span>
          <span className="text-sm font-medium tracking-tight">
            BHARAT CLOUD<span className="text-zinc-500">.store</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Mumbai E2E
          </span>
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
          <Link
            href="/pricing"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black"
          >
            Buy
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="pt-16 pb-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-300 backdrop-blur">
            <Clock3 className="h-3.5 w-3.5" />
            <span className="saas-num">{OFFER_DAYS_LEFT}d</span>
            <span>left on this seat window</span>
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
            Mumbai me safe hai
          </h1>
          <p className="mt-5 max-w-xl text-lg text-zinc-400">
            Company mailboxes, fixed ID caps, and yearly storage on E2E Mumbai.
            The sixth ID does not sneak in. It opens a pro-rata upgrade.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {STORAGE_PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} featured={plan.id === "300gb"} />
          ))}
        </section>

        <section className="mt-4 rounded-[24px] border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Rent breakdown</p>
              <p className="mt-2 text-sm text-zinc-300">
                Admin {formatInr(RENT.adminMonthlyInr)}/mo + employee {formatInr(RENT.employeeFirst30DaysInr)}/mo
                for {RENT.introDays} days, then {formatInr(RENT.employeeAfter30DaysInr)}.
              </p>
            </div>
            <p className="saas-num text-sm text-zinc-200">
              {quote.adminSeats} admin + {quote.employeeSeats} emp = {formatInr(quote.monthlyInr)}/mo
              {" × "}
              {quote.months} = {formatInr(quote.rentTotalInr)}
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="5 IDs / month" value={formatInr(quote.monthlyInr)} />
            <Stat label="Rent × 11 months" value={formatInr(quote.rentTotalInr)} />
            <Stat
              label="5999 + rent"
              value={formatInr(quote.grandTotalInr)}
            />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">Comparison</h2>
          <div className="mt-6 overflow-x-auto rounded-[24px] border border-zinc-800">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-zinc-900/80 text-zinc-400">
                <tr>
                  <th className="px-5 py-4 font-medium"> </th>
                  {STORAGE_PLANS.map((plan) => (
                    <th key={plan.id} className="px-5 py-4 font-medium">
                      {plan.storageLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-zinc-900/40">
                <CompareRow label="Yearly" values={STORAGE_PLANS.map((p) => formatInr(p.yearlyInr))} />
                <CompareRow label="ID cap" values={STORAGE_PLANS.map((p) => String(p.maxIds))} />
                <CompareRow label="Past cap" values={["Block + upgrade", "Block + upgrade", "At cap"]} />
                <CompareRow label="Region" values={["Mumbai", "Mumbai", "Mumbai"]} />
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-2">
          <Faq
            q="What happens on the 6th ID?"
            a="The 100GB plan stops at 5 IDs. The next add is blocked and the upgrade modal shows remaining credit against the next yearly price."
          />
          <Faq
            q="How is rent counted?"
            a="One admin seat is 199 per month. Each employee is 49 for the first 30 days and 99 after. Five IDs in the intro window are 395 per month."
          />
          <Faq
            q="What if rent is late?"
            a="At 7 days, backup pauses and storage stays safe. At 30 days the workspace is read-only."
          />
          <Faq
            q="What does a GoDaddy scan change?"
            a="Active mailboxes that are not registered become a forward block. Pending is unregistered seats times 49 times the open months."
          />
        </section>
      </main>
    </div>
  );
}

function PlanCard({ plan, featured }: { plan: StoragePlan; featured?: boolean }) {
  return (
    <article
      className={`flex flex-col rounded-[24px] border bg-zinc-900/50 p-6 backdrop-blur ${
        featured ? "border-white/30" : "border-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between text-zinc-400">
        <HardDrive className="h-4 w-4" />
        <span className="text-xs uppercase tracking-[0.16em]">Fix {plan.maxIds} IDs</span>
      </div>
      <h2 className="mt-8 text-lg font-medium">{plan.name}</h2>
      <p className="saas-num mt-3 text-4xl font-medium tracking-tight">{formatInr(plan.yearlyInr)}</p>
      <p className="mt-1 text-sm text-zinc-500">per year</p>
      <p className="mt-6 flex items-center gap-2 text-sm text-zinc-300">
        <Shield className="h-4 w-4 text-zinc-500" />
        {plan.maxIds} mailboxes max
      </p>
      <Link
        href="/pricing"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black"
      >
        Buy
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="saas-num mt-1 text-xl">{value}</p>
    </div>
  );
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-t border-zinc-800">
      <td className="px-5 py-4 text-zinc-400">{label}</td>
      {values.map((value, index) => (
        <td key={`${label}-${index}`} className="saas-num px-5 py-4">
          {value}
        </td>
      ))}
    </tr>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
      <h3 className="font-medium">{q}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{a}</p>
    </div>
  );
}
