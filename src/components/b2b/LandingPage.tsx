import Link from "next/link";

import { PRICING_PLANS, type PlanId } from "@/lib/b2b/plans";
import { SiteHeader } from "@/components/b2b/SiteHeader";

const features = [
  {
    title: "Team Control",
    body: "Roles, invites, and audit-friendly access for every department.",
  },
  {
    title: "Shared Storage",
    body: "One vault for contracts, GST, and field media — India-ready hosting.",
  },
  {
    title: "Enterprise-grade Security",
    body: "Versioning, soft delete, and encryption in transit by default.",
  },
];

const planOrder: PlanId[] = ["starter", "standard", "business"];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/40 via-slate-950 to-slate-950" />
      <div className="relative">
        <SiteHeader variant="dark" />

        <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 text-center sm:pt-24">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-300/90">
            BharatCloud B2B
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Apna Business Cloud,
            <span className="block bg-gradient-to-r from-sky-300 to-blue-500 bg-clip-text text-transparent">
              India Me Safe
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Apni team ki files manage karo — premium storage built for Indian
            companies.
          </p>
          <Link
            href="/signup"
            className="mt-10 inline-flex rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:brightness-110"
          >
            Start Free Trial
          </Link>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 sm:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl"
            >
              <h2 className="text-lg font-semibold text-white">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {f.body}
              </p>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20" id="pricing">
          <h2 className="text-center text-3xl font-semibold">Pricing</h2>
          <p className="mt-2 text-center text-slate-400">
            Transparent plans · Upgrade anytime
          </p>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {planOrder.map((id) => {
              const plan = PRICING_PLANS[id];
              return (
                <PricingCard
                  key={id}
                  planId={id}
                  name={plan.name}
                  price={plan.priceInr}
                  users={plan.maxUsers}
                  storageGb={plan.storageGb}
                  badge={plan.badge}
                />
              );
            })}
          </div>
        </section>

        <footer className="border-t border-white/10 py-10 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} BharatCloud.store
        </footer>
      </div>
    </div>
  );
}

function PricingCard({
  planId,
  name,
  price,
  users,
  storageGb,
  badge,
}: {
  planId: PlanId;
  name: string;
  price: number;
  users: number;
  storageGb: number;
  badge?: "popular" | "business";
}) {
  const highlight = badge === "popular";
  return (
    <Link
      href={`/checkout?plan=${planId}`}
      className={`group relative flex flex-col rounded-2xl border p-8 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl ${
        highlight
          ? "border-sky-400/50 bg-gradient-to-b from-sky-500/20 to-blue-600/10 shadow-xl shadow-sky-500/10"
          : "border-white/15 bg-white/5 hover:border-sky-500/30"
      }`}
    >
      {badge === "popular" && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          Most Popular
        </span>
      )}
      {badge === "business" && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-violet-400/50 bg-violet-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-200">
          Best for Business
        </span>
      )}
      <h3 className="text-lg font-semibold text-white">{name}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-white">₹{price}</span>
        <span className="text-sm text-slate-400">
          <span className="text-xs">+ GST</span> / month
        </span>
      </div>
      <ul className="mt-8 flex-1 space-y-3 text-sm text-slate-300">
        <li>{users} Users</li>
        <li>{storageGb >= 1024 ? "1TB" : `${storageGb}GB`} Storage</li>
      </ul>
      <span
        className={`mt-8 w-full rounded-xl py-3 text-center text-sm font-semibold ${
          highlight
            ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white"
            : "border border-white/20 bg-white/5 text-white group-hover:bg-white/10"
        }`}
      >
        Get Started
      </span>
    </Link>
  );
}
