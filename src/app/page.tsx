"use client";

import Link from "next/link";

const NAV = [
  { id: "features", label: "Features" },
  { id: "dashboard-preview", label: "Vault" },
  { id: "pricing", label: "Pricing" },
  { id: "contact", label: "Contact" },
] as const;

const FEATURES = [
  {
    title: "End-to-End Encryption",
    body: "Company files stay encrypted for the people who are meant to open them.",
  },
  {
    title: "Data Residency in India",
    body: "Storage stays in India for teams that need their data in the country.",
  },
  {
    title: "Team Collaboration",
    body: "Share folders and work from one company workspace.",
  },
  {
    title: "99.99% Uptime",
    body: "The vault stays available while the team keeps working.",
  },
];

const VAULT_FILES = [
  { name: "Q3-Invoices.pdf", meta: "PDF · 2.4 MB", kind: "File" },
  { name: "Team-Photos", meta: "Folder · 48 items", kind: "Folder" },
  { name: "Contract-Jammu.docx", meta: "Doc · 180 KB", kind: "File" },
  { name: "Backup-Manifest.csv", meta: "Sheet · 64 KB", kind: "File" },
];

function scrollToSection(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#050508] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,107,0,0.35)_1px,_transparent_0)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(59,130,246,0.28)_1px,_transparent_0)] bg-[size:40px_40px] [background-position:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-orange-900/20" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050508]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a
            href="#hero"
            onClick={(event) => scrollToSection(event, "hero")}
            className="flex min-w-0 items-center gap-2 text-lg font-bold text-white sm:text-2xl"
          >
            <span className="text-2xl sm:text-3xl" aria-hidden>
              ☁️
            </span>
            <span className="truncate">
              BharatCloud<span className="text-orange-500">.store</span>
            </span>
          </a>
          <nav className="hidden items-center gap-8 text-gray-400 md:flex">
            {NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(event) => scrollToSection(event, item.id)}
                className="hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border border-white/20 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 sm:px-5 sm:text-sm"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-2 text-xs font-bold text-white sm:px-5 sm:text-sm"
            >
              Sign Up
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-2 px-4 pb-3 text-sm text-gray-400 md:hidden">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(event) => scrollToSection(event, item.id)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6">
        <section id="hero" className="scroll-mt-24 py-16 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">
            BharatCloud by BharatTijori™
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
            Secure cloud storage for modern teams in Bharat
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-gray-400">
            Store, share, and back up company files in one encrypted vault. Built for Indian teams.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#pricing"
              onClick={(event) => scrollToSection(event, "pricing")}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-8 py-3 text-center font-bold text-white"
            >
              See pricing
            </a>
            <a
              href="#contact"
              onClick={(event) => scrollToSection(event, "contact")}
              className="rounded-xl border border-orange-500/40 px-8 py-3 text-center font-bold text-orange-300 hover:bg-orange-500/10"
            >
              Contact
            </a>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 py-16">
          <h2 className="text-4xl font-black">Features</h2>
          <p className="mt-3 max-w-2xl text-lg text-gray-400">
            Encryption, India residency, collaboration, and uptime. Visible right here.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6"
              >
                <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="dashboard-preview" className="scroll-mt-24 py-16">
          <h2 className="text-4xl font-black">Vault preview</h2>
          <p className="mt-3 max-w-2xl text-lg text-gray-400">
            The file dashboard your team opens after login. This is a preview on the same page.
          </p>
          <div className="mt-10 overflow-hidden rounded-[24px] border border-white/10 bg-[#10131a] shadow-[0_0_60px_rgba(255,107,0,0.12)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-orange-300">My Vault</p>
                <p className="mt-1 text-sm text-gray-400">Encrypted company files</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-400">
                Search files
              </div>
            </div>
            <div className="grid gap-px bg-white/10 sm:grid-cols-[180px_1fr]">
              <aside className="bg-[#0c0f16] p-4 text-sm text-gray-300">
                <p className="rounded-lg bg-orange-500/15 px-3 py-2 font-semibold text-orange-200">Files</p>
                <p className="mt-2 px-3 py-2 text-gray-500">Emails</p>
                <p className="px-3 py-2 text-gray-500">Shared</p>
              </aside>
              <div className="bg-[#10131a]">
                <div className="grid grid-cols-[1fr_auto] gap-3 px-5 py-3 text-xs uppercase tracking-wide text-gray-500">
                  <span>Name</span>
                  <span>Details</span>
                </div>
                {VAULT_FILES.map((file) => (
                  <div
                    key={file.name}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-white/10 px-5 py-4"
                  >
                    <div>
                      <p className="font-semibold text-white">{file.name}</p>
                      <p className="text-xs text-gray-500">{file.kind}</p>
                    </div>
                    <p className="text-sm text-gray-400">{file.meta}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 py-16">
          <div className="mb-12 text-center">
            <p className="mx-auto inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-8 py-3 text-2xl font-black tracking-[0.14em] text-white shadow-[0_0_40px_rgba(255,107,0,0.45)] sm:text-4xl">
              7 DAYS FREE TRIAL
            </p>
            <h2 className="mb-4 mt-8 text-5xl font-black text-white">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-400">
              Built for Indian businesses. GST not applicable. Upgrade or cancel anytime.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative rounded-[24px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-2xl">
                🚀
              </div>
              <h3 className="text-2xl font-bold text-white">Starter</h3>
              <div className="mt-4 text-5xl font-black text-white">Rs 6,999</div>
              <p className="mt-2 text-sm text-gray-400">per year</p>
              <p className="mt-1 text-xs text-gray-400">5 users included</p>
              <div className="my-6 h-[1px] bg-white/10" />
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-3">
                  <span className="text-orange-500">✔</span> 100GB Secure Storage
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-500">✔</span> Up to 5 Users
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-500">✔</span> 99.9% Uptime SLA
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-500">✔</span> Email Support
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-500">✔</span> SSL Encryption
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-8 flex h-12 w-full items-center justify-center rounded-xl border border-orange-500/30 font-bold text-orange-400 hover:bg-orange-500/10"
              >
                Get Started
              </Link>
              <p className="mt-2 text-center text-xs text-gray-400">7 Days Free - No Credit Card Required</p>
            </div>

            <div className="relative scale-[1.02] rounded-[24px] border-2 border-orange-500 bg-gradient-to-br from-orange-600/20 to-red-600/20 p-8 shadow-[0_0_80px_rgba(255,107,0,0.4)] backdrop-blur-xl md:scale-[1.05]">
              <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-1 text-sm font-bold text-white">
                <span>🔥</span> Most Popular
              </div>
              <h3 className="text-center text-2xl font-bold text-white">Growth</h3>
              <div className="mt-4 bg-gradient-to-r from-orange-200 to-orange-400 bg-clip-text text-center text-5xl font-black text-transparent">
                Rs 19,999
              </div>
              <p className="mt-2 text-center text-sm text-orange-200/80">per year</p>
              <p className="mt-1 text-center text-xs text-gray-400">25 users included</p>
              <div className="my-6 h-[1px] bg-orange-500/30" />
              <ul className="space-y-3 text-sm text-white">
                {[
                  "500GB Secure Storage",
                  "Up to 25 Users",
                  "99.99% Uptime SLA",
                  "Priority Support",
                  "Advanced Analytics",
                  "Team Collaboration",
                  "API Access",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs">✔</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 font-bold text-white shadow-lg hover:shadow-orange-500/50"
              >
                Start 7 Days Free Trial
              </Link>
              <p className="mt-2 text-center text-xs text-gray-300">7 Days Free - No Credit Card Required</p>
            </div>

            <div className="relative rounded-[24px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-2xl">
                🏢
              </div>
              <h3 className="text-2xl font-bold text-white">Enterprise</h3>
              <div className="mt-4 text-5xl font-black text-white">Rs 39,999</div>
              <p className="mt-2 text-sm text-gray-400">per year</p>
              <p className="mt-1 text-xs text-gray-400">Unlimited</p>
              <div className="my-6 h-[1px] bg-white/10" />
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-3">
                  <span className="text-blue-400">✔</span> 2TB Secure Storage
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400">✔</span> Unlimited Users
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400">✔</span> 99.99% SLA Guarantee
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400">✔</span> 24/7 Dedicated Support
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-400">✔</span> Dedicated Account Manager
                </li>
              </ul>
              <a
                href="#contact"
                onClick={(event) => scrollToSection(event, "contact")}
                className="mt-8 flex h-12 w-full items-center justify-center rounded-xl border border-blue-500/30 font-bold text-blue-400 hover:bg-blue-500/10"
              >
                Contact Sales
              </a>
              <p className="mt-2 text-center text-xs text-gray-400">7 Days Free - No Credit Card Required</p>
            </div>
          </div>
          <p className="mt-5 text-center text-sm font-semibold text-white">
            7 Days Free Trial | No Credit Card Required | Cancel Anytime
          </p>
          <p className="mt-3 text-center text-sm text-gray-400">
            Need more users? Extra User - Rs 99 / Month per user
          </p>
        </section>

        <section id="contact" className="scroll-mt-24 py-16">
          <div className="rounded-[24px] border border-orange-500/30 bg-white/[0.04] px-6 py-10 text-center sm:px-10">
            <h2 className="text-4xl font-black">Contact</h2>
            <p className="mt-4 text-lg text-gray-300">
              Email:{" "}
              <a
                href="mailto:support@bharatcloud.store"
                className="font-semibold text-orange-400 underline decoration-orange-400/40 underline-offset-4"
              >
                support@bharatcloud.store
              </a>
            </p>
            <p className="mt-2 text-lg text-gray-300">Jammu City, Jammu &amp; Kashmir</p>
          </div>
        </section>
      </main>

      <footer id="footer" className="relative z-10 border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 text-center">
          <p className="text-sm font-semibold text-white">BharatCloud by BharatTijori™</p>
          <p className="text-sm text-gray-400">support@bharatcloud.store · Jammu City</p>
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} BharatCloud.store</p>
        </div>
      </footer>
    </div>
  );
}
