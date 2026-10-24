import Link from "next/link";

const SALES = "mailto:sales@bharatcloud.store";
const SUPPORT = "mailto:support@bharatcloud.store";

const COMPARISON = [
  ["Storage", "100GB", "500GB", "2TB"],
  ["Users", "Up to 5", "Up to 25", "Unlimited"],
  ["Support", "Email", "Priority 24/7", "Dedicated Manager"],
  ["SLA", "99.9%", "99.9%", "99.9%"],
] as const;

export default function BharatCloudLanding() {
  return (
    <main className="bg-white font-sans text-slate-900">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-b border-orange-100 p-6">
        <Link href="/" className="text-2xl font-black">
          BharatCloud<span className="text-orange-500">.store</span>
        </Link>
        <div className="flex flex-wrap gap-4 text-sm sm:gap-6">
          <Link href="/" className="hover:text-orange-500">
            Home
          </Link>
          <a href="#pricing" className="hover:text-orange-500">
            Pricing
          </a>
          <a href="#features" className="hover:text-orange-500">
            Features
          </a>
          <a href="#security" className="hover:text-orange-500">
            Security
          </a>
          <a href={SUPPORT} className="hover:text-orange-500">
            Contact
          </a>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl p-6 py-16 sm:p-10 sm:py-20">
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          Secure Cloud Storage for
          <br />
          Modern Teams in Bharat
        </h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          Store, share, and collaborate securely with enterprise-grade cloud storage built for teams
          across India.
        </p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-lg bg-orange-500 px-8 py-3 text-center font-semibold text-white hover:bg-orange-600"
          >
            Start Free Trial
          </Link>
          <a
            href={SALES}
            className="rounded-lg border border-orange-500 px-8 py-3 text-center text-orange-500 hover:bg-orange-50"
          >
            Talk to Sales
          </a>
        </div>
        <div id="security" className="mt-10 flex scroll-mt-6 flex-col gap-3 text-sm sm:flex-row sm:gap-8">
          <span>🔒 End-to-end Encryption</span>
          <span>🇮🇳 Data Residency in India</span>
          <span>✅ 99.9% Uptime SLA</span>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-6 bg-gray-50 p-6 py-16 sm:p-10">
        <h2 className="text-center text-4xl font-bold">Pricing</h2>
        <p className="mt-2 text-center text-slate-600">Simple, transparent pricing. GST 18% applied.</p>
        <div className="mx-auto mt-10 grid max-w-7xl gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <p className="inline rounded bg-orange-500 px-3 py-1 text-xs text-white">STARTER</p>
            <h3 className="mt-4 text-3xl font-black">
              ₹6,999 + GST =
              <br />
              ₹8,259 Final
            </h3>
            <p className="mt-1 text-sm">100GB • Up to 5 Users</p>
            <Link
              href="/signup"
              className="mt-6 block w-full rounded-lg border border-orange-500 py-2 text-center text-orange-500 hover:bg-orange-50"
            >
              Choose Starter
            </Link>
          </div>

          <div className="rounded-2xl bg-orange-300 p-8 shadow-sm">
            <p className="inline rounded bg-orange-600 px-3 py-1 text-xs text-white">GROWTH</p>
            <h3 className="mt-4 text-3xl font-black">
              ₹19,999 + GST =
              <br />
              ₹23,599 Final
            </h3>
            <p className="mt-1 text-sm">500GB • Up to 25 Users</p>
            <Link
              href="/signup"
              className="mt-6 block w-full rounded-lg bg-orange-600 py-2 text-center text-white hover:bg-orange-700"
            >
              Choose Growth
            </Link>
          </div>

          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <p className="inline rounded bg-orange-500 px-3 py-1 text-xs text-white">ENTERPRISE</p>
            <h3 className="mt-4 text-3xl font-black">
              ₹39,999 + GST =
              <br />
              ₹47,199 Final
            </h3>
            <p className="mt-1 text-sm">2TB • Unlimited Users</p>
            <a
              href={SALES}
              className="mt-6 block w-full rounded-lg border border-orange-500 py-2 text-center text-orange-500 hover:bg-orange-50"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-5xl scroll-mt-6 p-6 py-16 sm:p-10">
        <h2 className="text-center text-4xl font-bold">Features Comparison</h2>
        <div className="mt-8 overflow-x-auto rounded-xl border text-sm">
          <div className="grid min-w-[640px] grid-cols-4 bg-orange-200 p-3 font-bold">
            <span>Feature</span>
            <span>Starter</span>
            <span>Growth</span>
            <span>Enterprise</span>
          </div>
          {COMPARISON.map((row) => (
            <div key={row[0]} className="grid min-w-[640px] grid-cols-4 border-t p-3">
              {row.map((cell, index) => (
                <span key={`${row[0]}-${index}`}>{cell}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-slate-900 p-4 text-center text-xs text-orange-300">
        © {new Date().getFullYear()} BharatCloud.store • Privacy • Terms •{" "}
        <a href="#security" className="hover:text-white">
          Security
        </a>{" "}
        •{" "}
        <a href={SUPPORT} className="hover:text-white">
          support@bharatcloud.store
        </a>
      </footer>
    </main>
  );
}
