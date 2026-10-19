import Link from "next/link";
import { Archive, BadgeIndianRupee, Flag, Lock, Server, Wallet } from "lucide-react";

const PLANS = [
  { name: "5 IDs", price: "Rs 5,999", storage: "100 GB", popular: false },
  { name: "20 IDs", price: "Rs 12,999", storage: "300 GB", popular: true },
  { name: "50 IDs", price: "Rs 14,999", storage: "1 TB", popular: false },
];

const WHY = [
  { icon: Flag, title: "Made in India 🇮🇳", body: "Data residency Mumbai E2E Only" },
  { icon: Lock, title: "High Secure", body: "256-bit encrypted. DPDP Act 2023 ready" },
  { icon: BadgeIndianRupee, title: "70% cheaper than Google Workspace", body: "Less than every backup" },
  { icon: Archive, title: "Yearly Archive", body: "E2E Mumbai long term secure" },
  { icon: Wallet, title: "Pay with Paytm UPI INR", body: "Instant UPI, wallets, and cards" },
  { icon: Server, title: "Hostinger site stays safe", body: "Zero downtime reliable" },
];

const COMPARE = [
  {
    name: "BharatCloud",
    price: "Rs 12,999/year",
    note: "20 IDs · MOST VALUE",
    ours: true,
    points: [
      "Made in India",
      "High Secure 256-bit",
      "Yearly Archive Mumbai E2E",
      "Paytm UPI",
      "Mumbai India",
    ],
  },
  {
    name: "Google Workspace",
    price: "$1440/year",
    note: "",
    ours: false,
    points: ["US hosting", "No archive", "Credit card only"],
  },
  {
    name: "Dropbox",
    price: "$1200/year",
    note: "",
    ours: false,
    points: ["Premium pricing", "128-bit", "No compliance"],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-600 text-sm font-black text-red-500 shadow-[0_0_20px_#FF1A1A]">
            BC
          </span>
          <span className="text-sm font-semibold tracking-wide">BharatCloud</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <span className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-400">
            Mumbai E2E
          </span>
          <Link href="/pricing" className="text-slate-300 hover:text-white">
            Pricing
          </Link>
          <Link href="/login" className="text-slate-300 hover:text-white">
            Sign in
          </Link>
          <Link
            href="/admin/platform"
            className="rounded-full border border-red-600 px-4 py-2 font-semibold text-red-500 shadow-[0_0_20px_#FF1A1A]"
          >
            God Mode
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-500">Mumbai E2E Only</p>
        <h1 className="mt-5 max-w-4xl text-[72px] font-semibold leading-none tracking-tight">
          Mumbai me safe hai
        </h1>
        <p className="mt-6 max-w-xl text-lg text-slate-400">
          Yearly archive on E2E Mumbai. Pay with Paytm. Site stays on Hostinger.
        </p>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-2xl border bg-[#0A0A0A] p-6 ${
                plan.popular
                  ? "scale-105 border-red-600 shadow-[0_0_20px_#FF0000]"
                  : "border-white/10"
              }`}
            >
              {plan.popular ? (
                <p className="text-xs font-black tracking-[0.2em] text-red-500">MOST POPULAR</p>
              ) : (
                <p className="text-xs font-semibold tracking-[0.16em] text-slate-500">YEARLY</p>
              )}
              <p className="mt-4 text-sm text-slate-400">{plan.name}</p>
              <p className="mt-2 text-4xl font-semibold">{plan.price}</p>
              <p className="mt-2 text-sm text-slate-500">{plan.storage} · per year</p>
              <Link
                href="/pricing"
                className="mt-8 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black"
              >
                View plan
              </Link>
            </article>
          ))}
        </div>

        <section className="mt-24">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Why BharatCloud? Made in India. Mumbai me safe hai
          </h2>
          <p className="mt-3 text-orange-400">Bharat ka data, Bharat me — 100% Secure</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map((item) => (
              <article key={item.title} className="rounded-xl border border-white/10 bg-[#1A1A1A] p-5">
                <item.icon className="h-6 w-6 text-orange-400" />
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Less than every backup — 70% cheaper
          </h2>
          <p className="mt-3 text-slate-400">Compare and save 70%+</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {COMPARE.map((col) => (
              <article
                key={col.name}
                className={`rounded-xl border p-5 ${
                  col.ours ? "border-emerald-500/50 bg-[#1A1A1A]" : "border-white/10 bg-[#1A1A1A]"
                }`}
              >
                <p className="text-sm text-slate-400">{col.name}</p>
                <p className="mt-2 text-2xl font-semibold">{col.price}</p>
                {col.note ? <p className="mt-1 text-xs font-bold text-emerald-400">{col.note}</p> : null}
                <ul className="mt-4 space-y-2 text-sm">
                  {col.points.map((point) => (
                    <li key={point} className={col.ours ? "text-emerald-400" : "text-red-400"}>
                      {col.ours ? "✓" : "✕"} {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-white/10 bg-[#1A1A1A] p-5">
            <p className="text-sm font-semibold">Annual Cost Comparison</p>
            <div className="mt-4 flex items-end gap-6">
              <div className="flex flex-1 flex-col items-center gap-2">
                <div className="h-10 w-full rounded-t bg-emerald-500" />
                <span className="text-xs text-slate-400">BharatCloud</span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-2">
                <div className="h-36 w-full rounded-t bg-red-600" />
                <span className="text-xs text-slate-400">Google Workspace</span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-2">
                <div className="h-28 w-full rounded-t bg-red-600" />
                <span className="text-xs text-slate-400">Dropbox</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              You save 70%+ annually vs Google Workspace. Built for India.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs tracking-[0.18em] text-slate-500">
        ISO · DPDP · MUMBAI
      </footer>
    </div>
  );
}
