import type { Metadata } from "next";

import { DarkSiteShell } from "@/components/marketing/DarkSiteShell";

export const metadata: Metadata = {
  title: "Features · BharatCloud.store",
  description: "Encryption, India data residency, uptime, collaboration, API access, and analytics.",
};

const FEATURES = [
  {
    title: "End-to-End Encryption",
    body: "Company files stay encrypted for the people who are meant to open them.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    ),
  },
  {
    title: "Data Residency in India",
    body: "Storage is kept in India for teams that need their data to stay in the country.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.2" />
      </svg>
    ),
  },
  {
    title: "99.99% Uptime",
    body: "The service is built to stay available while teams keep working.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 13h4l2-5 4 10 2-5h4" />
      </svg>
    ),
  },
  {
    title: "Team Collaboration",
    body: "Share folders and work from one company workspace.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="8" r="2.2" />
        <circle cx="16" cy="9" r="1.8" />
        <path d="M4.8 18.5c.4-2.4 2.2-3.7 4.2-3.7s3.8 1.3 4.2 3.7" />
        <path d="M14 15.2c1.3-.4 2.6.2 3.4 1.6.5.9.8 1.7.8 1.7" />
      </svg>
    ),
  },
  {
    title: "API Access",
    body: "Connect BharatCloud to the tools your team already uses.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 8 4 12l4 4M16 8l4 4-4 4M13 6l-2 12" />
      </svg>
    ),
  },
  {
    title: "Advanced Analytics",
    body: "See storage use and team activity from one view.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19V5M4 19h16" />
        <path d="M8 15v-3M12 15V8M16 15v-5" />
      </svg>
    ),
  },
];

export default function FeaturesPage() {
  return (
    <DarkSiteShell active="features">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-white sm:text-5xl">Everything you need to scale</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
          Security, residency, and the tools a growing team uses every day.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className="rounded-[24px] border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl transition-all hover:border-orange-500 hover:shadow-[0_0_40px_rgba(255,107,0,0.35)]"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-white">
              {feature.icon}
            </div>
            <h2 className="text-lg font-bold text-white">{feature.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{feature.body}</p>
          </article>
        ))}
      </div>
    </DarkSiteShell>
  );
}
