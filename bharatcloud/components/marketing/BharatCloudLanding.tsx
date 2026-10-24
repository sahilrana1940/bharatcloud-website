import Link from "next/link";

export default function BharatCloudLanding() {
  return (
    <main className="bg-white font-sans text-slate-900">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-b border-orange-100 p-6">
        <Link href="/" className="text-2xl font-black">
          BharatCloud<span className="text-orange-500">.store</span>
        </Link>
        <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-700 sm:gap-6">
          <a href="#" className="hover:text-orange-500">
            Home
          </a>
          <a href="#pricing" className="hover:text-orange-500">
            Pricing
          </a>
          <a href="#features" className="hover:text-orange-500">
            Features
          </a>
          <a href="#security" className="hover:text-orange-500">
            Security
          </a>
          <a href="mailto:sales@bharatcloud.store" className="hover:text-orange-500">
            Contact
          </a>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl p-6 py-16 sm:p-10 sm:py-20">
        <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
          Secure Cloud Storage for
          <br />
          Modern Teams in Bharat
        </h2>
        <p className="mt-4 max-w-2xl text-slate-600">
          Store, share, and collaborate securely with enterprise-grade cloud storage built for teams
          across India.
        </p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-lg bg-orange-500 px-8 py-3 text-center font-semibold text-white transition hover:bg-orange-600"
          >
            Start Free Trial
          </Link>
          <a
            href="mailto:sales@bharatcloud.store"
            className="rounded-lg border border-orange-500 px-8 py-3 text-center font-semibold text-orange-500 transition hover:bg-orange-50"
          >
            Talk to Sales
          </a>
        </div>
        <div
          id="security"
          className="mt-10 flex flex-col gap-4 text-sm text-slate-700 sm:flex-row sm:gap-8"
        >
          <span>End-to-end Encryption</span>
          <span>Data Residency in India</span>
          <span>99.9% Uptime SLA</span>
        </div>
        <p className="mt-8 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-medium text-slate-700 sm:text-sm">
          ISO 27001 Certified • SOC 2 Compliant • GDPR Compliant
        </p>
      </section>

      <section id="pricing" className="bg-gray-50 p-6 py-16 sm:p-10">
        <h3 className="text-center text-4xl font-bold">Pricing</h3>
        <p className="mt-2 text-center text-slate-600">
          Simple, transparent pricing for teams of every size. All plans billed annually. GST 18%
          applied.
        </p>
        <div className="mx-auto mt-10 grid max-w-7xl gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <p className="inline rounded bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
              STARTER
            </p>
            <h4 className="mt-4 text-3xl font-black">
              ₹6,999 + GST =
              <br />
              ₹8,259 Final
            </h4>
            <p className="mt-1 text-sm text-slate-600">100GB • Up to 5 Users</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>100GB Cloud Storage</li>
              <li>Up to 5 Users</li>
              <li>End-to-end Encryption</li>
              <li>Email Support</li>
              <li>Data Residency in India</li>
            </ul>
            <Link
              href="/dashboard"
              className="mt-6 block w-full rounded-lg border border-orange-500 py-2 text-center font-semibold text-orange-500 hover:bg-orange-50"
            >
              Choose Starter
            </Link>
          </div>

          <div className="relative rounded-2xl bg-orange-300 p-8 shadow-md">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white">
              MOST POPULAR
            </span>
            <p className="inline rounded bg-orange-600 px-3 py-1 text-xs font-semibold text-white">
              GROWTH
            </p>
            <h4 className="mt-4 text-3xl font-black">
              ₹19,999 + GST =
              <br />
              ₹23,599 Final
            </h4>
            <p className="mt-1 text-sm">500GB • Up to 25 Users</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>500GB Cloud Storage</li>
              <li>Up to 25 Users</li>
              <li>File Versioning &amp; Recovery</li>
              <li>Team Sharing &amp; Collaboration</li>
              <li>Admin Controls</li>
              <li>Priority Support 24/7</li>
            </ul>
            <Link
              href="/dashboard"
              className="mt-6 block w-full rounded-lg bg-orange-600 py-2 text-center font-semibold text-white hover:bg-orange-700"
            >
              Choose Growth
            </Link>
          </div>

          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <p className="inline rounded bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
              ENTERPRISE
            </p>
            <h4 className="mt-4 text-3xl font-black">
              ₹39,999 + GST =
              <br />
              ₹47,199 Final
            </h4>
            <p className="mt-1 text-sm text-slate-600">2TB • Unlimited Users</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>2TB Cloud Storage</li>
              <li>Unlimited Users</li>
              <li>SSO &amp; Directory Sync</li>
              <li>Audit Logs &amp; Compliance Reports</li>
              <li>Dedicated Account Manager</li>
              <li>Custom SLA &amp; Support</li>
            </ul>
            <a
              href="mailto:sales@bharatcloud.store"
              className="mt-6 block w-full rounded-lg border border-orange-500 py-2 text-center font-semibold text-orange-500 hover:bg-orange-50"
            >
              Contact Sales
            </a>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-7xl text-center text-sm text-slate-600">
          *GST is 18%. Custom enterprise solutions available.
        </p>
      </section>

      <section id="features" className="mx-auto max-w-5xl p-6 py-16 sm:p-10">
        <h3 className="text-center text-4xl font-bold">Features Comparison</h3>
        <div className="mt-8 overflow-hidden rounded-xl border text-sm shadow-sm">
          <div className="grid grid-cols-4 bg-orange-200 p-3 font-bold">
            <span>Feature</span>
            <span>Starter</span>
            <span>Growth</span>
            <span>Enterprise</span>
          </div>
          {[
            ["Storage", "100GB", "500GB", "2TB"],
            ["Users", "Up to 5", "Up to 25", "Unlimited"],
            ["Data Residency in India", "Yes", "Yes", "Yes"],
            ["End-to-end Encryption", "Yes", "Yes", "Yes"],
            ["File Versioning", "—", "Yes", "Yes"],
            ["Team Sharing", "—", "Yes", "Yes"],
            ["Admin Controls", "—", "Yes", "Yes"],
            ["Audit Logs", "—", "—", "Yes"],
            ["24/7 Support", "Email", "Priority", "Dedicated"],
            ["SLA", "99.9%", "99.9%", "99.9%"],
          ].map((row) => (
            <div key={row[0]} className="grid grid-cols-4 border-t p-3 even:bg-slate-50">
              <span className="font-medium text-slate-800">{row[0]}</span>
              <span>{row[1]}</span>
              <span>{row[2]}</span>
              <span>{row[3]}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-slate-900 p-4 text-center text-xs text-orange-300">
        © {new Date().getFullYear()} BharatCloud.store • Privacy • Terms • Security •
        support@bharatcloud.store
      </footer>
    </main>
  );
}
