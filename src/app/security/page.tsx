import type { Metadata } from "next";

import { DarkSiteShell } from "@/components/marketing/DarkSiteShell";

export const metadata: Metadata = {
  title: "Security · BharatCloud.store",
  description: "SOC 2 Type II, GDPR, SSL encryption, and a 99.9% uptime SLA.",
};

const CONTROLS = [
  {
    title: "SOC 2 Type II",
    body: "Controls for security, availability, and confidentiality, reviewed over time.",
    icon: "🛡️",
  },
  {
    title: "GDPR Ready",
    body: "Access, retention, and request handling designed for privacy obligations.",
    icon: "📋",
  },
  {
    title: "SSL Encryption",
    body: "Traffic between the team and BharatCloud is encrypted in transit.",
    icon: "🔐",
  },
  {
    title: "99.9% Uptime SLA",
    body: "A published uptime target for teams that depend on storage during the workday.",
    icon: "⏱️",
  },
];

const CHECKS = [
  "Encryption in transit and at rest",
  "Access limited to the company workspace",
  "Data residency in India",
  "Audit-friendly activity history",
];

const BADGES = ["SOC 2 Type II", "GDPR Ready", "SSL Encryption", "ISO 27001"];

export default function SecurityPage() {
  return (
    <DarkSiteShell active="security">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-white sm:text-5xl">Security you can trust</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
          Controls for teams that need a clear answer on encryption, privacy, and uptime.
        </p>
      </div>

      <div className="mb-10 flex flex-wrap justify-center gap-3">
        {BADGES.map((badge) => (
          <span
            key={badge}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl"
          >
            {badge}
          </span>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {CONTROLS.map((item) => (
          <article
            key={item.title}
            className="rounded-[24px] border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl transition-all hover:border-orange-500 hover:shadow-[0_0_40px_rgba(255,107,0,0.35)]"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-2xl">
              {item.icon}
            </div>
            <h2 className="text-xl font-bold text-white">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{item.body}</p>
          </article>
        ))}
      </div>

      <ul className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
        {CHECKS.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-gray-200">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
              ✔
            </span>
            {item}
          </li>
        ))}
      </ul>
    </DarkSiteShell>
  );
}
