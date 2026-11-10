import Link from "next/link";

export function LandingView() {
  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#10243E]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <div>
          <p className="text-xl font-bold tracking-tight">BharatCloud.store</p>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#FF6B00]">
            BHARAT TIJORI DRIVE
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full border border-[#10243E]/20 bg-white px-4 py-2 text-sm font-semibold"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white"
          >
            Get Started
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 pb-4 pt-4 lg:grid-cols-2">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-[#FF6B00]">
            INDIA KA APNA BUSINESS DRIVE
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] sm:text-6xl">
            Cloud for Bharat,
          </h1>
          <h1 className="text-4xl font-bold leading-[1.05] text-[#FF6B00] sm:text-6xl">
            Cloud for World.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
            Bharat ka apna Business Drive. Email Backup, Bharat Tijori Drive, Team and Device Control - Sab ek jagah. Mumbai se, poori Duniya ke liye.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="rounded-xl bg-[#10243E] px-6 py-3 text-sm font-bold text-white"
            >
              Start with Rs 6,999
            </Link>
            <Link
              href="#plans"
              className="rounded-xl border border-[#10243E]/15 bg-white px-6 py-3 text-sm font-semibold"
            >
              View All Plans
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-[#10243E]/10 bg-white p-6 shadow-lg">
          <p className="text-xs font-bold tracking-wide text-[#FF6B00]">
            STARTER PLAN - MOST POPULAR
          </p>
          <h2 className="mt-2 text-2xl font-bold">Starter</h2>
          <p className="mt-2 text-3xl font-bold">Rs 6,999 / Year</p>
          <p className="mt-4 text-sm">5 ID Employee ID</p>
          <p className="mt-2 text-sm">500GB Bharat Tijori Drive</p>
          <p className="mt-2 text-sm">1 Mailbox Email Backup</p>
          <p className="mt-2 text-sm">Device Control + Admin Full Control</p>
          <p className="mt-2 text-sm font-semibold">No Partner - Direct From Company</p>
          <Link
            href="/pricing"
            className="mt-6 block rounded-xl bg-[#FF6B00] py-3 text-center text-sm font-bold text-white"
          >
            Choose Starter
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-3xl bg-[#10243E] p-6 text-white md:p-8">
          <h2 className="text-2xl font-bold">Global Presence - Mumbai to World</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            India • USA • UK • UAE • Singapore • EU - 50k+ Customers • 6 Regions • 99.99% Uptime
          </p>
        </div>
      </div>

      <div id="plans" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-center text-3xl font-bold">All Plans</h2>
        <p className="mt-2 text-center text-slate-600">
          No Partner • No Hidden Charge • GST Invoice
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">STARTER</p>
            <p className="mt-2 text-3xl font-bold">Rs 6,999 / year</p>
            <p className="mt-4 text-sm">5 ID</p>
            <p className="mt-2 text-sm">500GB</p>
            <p className="mt-2 text-sm">1 Mailbox</p>
            <p className="mt-2 text-sm">Device Control</p>
            <Link
              href="/pricing"
              className="mt-6 block rounded-xl bg-[#10243E] py-3 text-center text-sm font-bold text-white"
            >
              Choose
            </Link>
          </div>
          <div className="rounded-2xl border-2 border-[#FF6B00] bg-white p-6 shadow-lg">
            <p className="text-xs font-bold tracking-wide text-[#FF6B00]">MOST POPULAR</p>
            <p className="mt-2 text-sm font-bold text-slate-500">BUSINESS</p>
            <p className="mt-2 text-3xl font-bold">Rs 24,999 / year</p>
            <p className="mt-4 text-sm">20 ID</p>
            <p className="mt-2 text-sm">2TB</p>
            <p className="mt-2 text-sm">4 Mailbox</p>
            <p className="mt-2 text-sm">Smart Mail No Duplicate</p>
            <Link
              href="/pricing"
              className="mt-6 block rounded-xl bg-[#FF6B00] py-3 text-center text-sm font-bold text-white"
            >
              Choose
            </Link>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-500">PRO</p>
            <p className="mt-2 text-3xl font-bold">Rs 34,999 / year</p>
            <p className="mt-4 text-sm">50 ID</p>
            <p className="mt-2 text-sm">5TB</p>
            <p className="mt-2 text-sm">Unlimited Mailbox</p>
            <p className="mt-2 text-sm">Forward Email Open</p>
            <Link
              href="/pricing"
              className="mt-6 block rounded-xl bg-[#10243E] py-3 text-center text-sm font-bold text-white"
            >
              Choose
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-[#10243E] py-8 text-center text-sm text-slate-300">
        <p>BharatCloud.store • Made in Bharat • Trusted Globally • © 2026</p>
      </div>
    </div>
  );
}
