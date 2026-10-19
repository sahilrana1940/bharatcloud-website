import Link from "next/link";

const PLANS = [
  { name: "5 IDs", price: "Rs 5,999", storage: "100 GB", popular: false },
  { name: "20 IDs", price: "Rs 12,999", storage: "300 GB", popular: true },
  { name: "50 IDs", price: "Rs 14,999", storage: "1 TB", popular: false },
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
      </main>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs tracking-[0.18em] text-slate-500">
        ISO · DPDP · MUMBAI
      </footer>
    </div>
  );
}
