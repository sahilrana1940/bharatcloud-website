import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing · Bharat Cloud",
};

const PLANS = [
  {
    name: "Starter",
    price: "₹5,999",
    audience: "For small teams & startups",
    popular: false,
    points: ["100GB Total Storage", "5 Users (Manual Approval)", "Email mail backup", "bharatcloud.drive files", "Mumbai Data Center"],
  },
  {
    name: "Growth",
    price: "₹24,999",
    audience: "For growing businesses & SMEs",
    popular: true,
    points: ["500GB Total Storage", "25 Users (Auto)", "Advanced Analytics & Insights", "Priority 24/7 Support", "Team Collaboration Tools"],
  },
  {
    name: "Enterprise",
    price: "₹39,999",
    audience: "For enterprises & large teams",
    popular: false,
    points: ["2TB Total Storage", "Unlimited (Auto)", "Dedicated Account Manager", "SLA 99.9% Uptime Guarantee", "Advanced Security & SSO"],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-16 text-[#0f172a] md:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <Link href="/" className="text-sm text-zinc-500 hover:text-[#0f172a]">
          BharatCloud
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold md:text-4xl">Simple, Transparent Pricing for Indian B2B</h1>
        <p className="mt-3 text-sm text-zinc-600">Email backup and Drive on bharatcloud.drive. Yearly plans, inclusive of all taxes.</p>
        <div className="mt-5 inline-block rounded-full border border-blue-200 bg-blue-50/50 px-4 py-1.5 text-xs text-blue-700 md:text-sm">
          Based in Mumbai | India Data Residence | Inclusive of all taxes
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl items-start gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={`relative rounded-2xl bg-white p-8 shadow-sm ${
              plan.popular ? "border-2 border-[#2563eb] shadow-xl" : "border border-zinc-200"
            }`}
          >
            {plan.popular ? (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#2563eb] px-6 py-1 text-xs font-bold tracking-wide text-white">
                MOST POPULAR
              </div>
            ) : null}
            <h2 className={`text-center text-lg ${plan.popular ? "font-bold text-[#1e40af]" : "font-medium"}`}>{plan.name}</h2>
            <div className="mt-2 text-center">
              <span className={`text-5xl font-extrabold tracking-tight ${plan.popular ? "text-[#1e3a8a]" : "text-[#0f172a]"}`}>
                {plan.price}
              </span>
              <span className="text-sm text-zinc-500">/year</span>
            </div>
            <p className="mt-1 text-center text-xs font-semibold text-emerald-700">Inclusive of all taxes</p>
            <p className="mt-3 text-center">
              <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">
                Shared for Team
              </span>
            </p>
            <p className="mt-3 text-center text-sm text-zinc-600">{plan.audience}</p>
            <ul className="mt-6 space-y-2.5 text-[13px]">
              {plan.points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span className="text-[#2563eb]">✓</span>
                  {point}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="mt-8 block w-full rounded-full bg-[#0f172a] py-3 text-center text-sm font-semibold text-white">
              Get Started
            </Link>
          </article>
        ))}
      </div>

      <p className="mx-auto mt-12 max-w-6xl rounded-xl bg-[#f1f5f9] px-4 py-4 text-center text-[11px] text-zinc-500">
        All plans inclusive of taxes | GST Not Applicable | Cancel anytime
      </p>
    </div>
  );
}
