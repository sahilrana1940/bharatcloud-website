"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Cloud,
  Lock,
  Shield,
  Users,
  Zap,
  Globe2,
  Server,
} from "lucide-react";

import { HeroProductPreview } from "@/components/b2b/HeroProductPreview";
import { LandingPromoBar } from "@/components/b2b/LandingPromoBar";
import { SiteHeader } from "@/components/b2b/SiteHeader";
import { TrustStrip } from "@/components/b2b/TrustStrip";
import { BRAND_PARENT, BRAND_PRODUCT } from "@/lib/brand";
import { PRICING_PLANS, type PlanId } from "@/lib/b2b/plans";
import { GlassPanel, ProGhostButton, ProPrimaryButton } from "@/components/ui/pro/primitives";

const planOrder: PlanId[] = ["starter", "standard", "business"];

const features = [
  {
    icon: Users,
    title: "Team & roles",
    body: "Invite admins and staff. Control who can backup, upload CCTV, or read the vault.",
  },
  {
    icon: Cloud,
    title: "Google Drive backup",
    body: "One-click OAuth. Incremental archive to Wasabi with drive.readonly and quota meter.",
  },
  {
    icon: Shield,
    title: "Bharat Tijori vault",
    body: "Encrypted storage, soft delete, and India-first compliance narrative your clients trust.",
  },
  {
    icon: Lock,
    title: "Security by default",
    body: "AES-256-GCM token storage, workspace cookies, and 401/402 billing gates in production.",
  },
  {
    icon: Zap,
    title: "Fast onboarding",
    body: "Signup → connect Drive → pay via UPI/Razorpay → auto backup jobs in minutes.",
  },
  {
    icon: Server,
    title: "Ops-ready admin",
    body: "Super admin Nexus dashboard, payment approval, and per-company storage tiers.",
  },
];

const stats = [
  { value: "99.9%", label: "Uptime target" },
  { value: "256-bit", label: "Encryption" },
  { value: "₹999+", label: "Plans from" },
  { value: "24/7", label: "Archive jobs" },
];

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none fixed inset-0 pro-mesh" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[480px] hero-glow" />

      <div className="relative">
        <LandingPromoBar />
        <SiteHeader variant="dark" />

        <section className="mx-auto max-w-7xl px-6 pb-16 pt-10 sm:pt-16 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <motion.span
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-gradient-to-r from-orange-50 to-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-700"
              >
                <span className="text-base">🇮🇳</span>
                {BRAND_PRODUCT} · {BRAND_PARENT}
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
              >
                Your business cloud,
                <span className="pro-gradient-text block">built for India.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mx-auto mt-6 max-w-xl text-lg text-slate-600 lg:mx-0"
              >
                Team backup, encrypted vault, Google Drive sync, and UPI billing — one beautiful
                workspace for owners, admins, and employees.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
              >
                <Link
                  href="/signup"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 via-cyan-500 to-emerald-500 px-10 py-4 text-base font-bold text-white shadow-xl shadow-cyan-500/25 transition hover:brightness-105 sm:w-auto"
                >
                  Start free trial
                </Link>
                <ProGhostButton href="/login" className="w-full px-10 py-4 text-base sm:w-auto">
                  Sign in
                </ProGhostButton>
              </motion.div>
              <p className="mt-4 text-xs text-slate-500">
                No credit card for trial · Plans from <strong className="text-slate-700">₹999/mo</strong> + GST
              </p>
            </div>
            <HeroProductPreview />
          </div>

          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s, i) => (
              <GlassPanel
                key={s.label}
                className={`p-5 text-center ${
                  i === 0
                    ? "border-orange-100 bg-gradient-to-b from-orange-50/80 to-white"
                    : i === 1
                      ? "border-cyan-100 bg-gradient-to-b from-cyan-50/80 to-white"
                      : i === 2
                        ? "border-emerald-100 bg-gradient-to-b from-emerald-50/80 to-white"
                        : ""
                }`}
              >
                <p className="text-2xl font-bold text-slate-900 sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{s.label}</p>
              </GlassPanel>
            ))}
          </div>
        </section>

        <TrustStrip />

        <section id="features" className="mx-auto max-w-7xl px-6 py-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Everything in one platform</h2>
            <p className="mt-3 text-slate-600">From super admin to shop-floor employee — same brand, pro UX.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <GlassPanel key={f.title} hover className="p-6 text-left">
                <f.icon className="h-8 w-8 text-cyan-500" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
              </GlassPanel>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <Building2 className="h-10 w-10 text-cyan-500" />
              <h2 className="mt-4 text-3xl font-bold text-slate-900">Built for Indian SMBs & enterprises</h2>
              <p className="mt-4 text-slate-600">
                GST docs, site photos, CCTV exports, and shared drives — archived with clear billing,
                owner dashboards, and employee-friendly backup buttons.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                <li className="flex gap-2">
                  <Globe2 className="h-4 w-4 shrink-0 text-cyan-500" />
                  India-first trust badges on every dashboard
                </li>
                <li className="flex gap-2">
                  <Shield className="h-4 w-4 shrink-0 text-cyan-500" />
                  Production billing gates (401 / 402) before backup runs
                </li>
              </ul>
            </div>
            <GlassPanel className="pro-ring-accent p-8">
              <p className="text-xs uppercase tracking-widest text-slate-500">Live workspace preview</p>
              <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 font-mono text-xs text-slate-600">
                <p>
                  <span className="font-semibold text-cyan-600">owner</span> @ company → Team & billing
                </p>
                <p>
                  <span className="font-semibold text-amber-600">employee</span> → Start My Backup
                </p>
                <p>
                  <span className="font-semibold text-emerald-600">super_admin</span> → Nexus Admin
                </p>
              </div>
              <Link
                href="/signup"
                className="mt-6 inline-flex text-sm font-semibold text-cyan-600 hover:underline"
              >
                Create your company workspace →
              </Link>
            </GlassPanel>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24" id="pricing">
          <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">Simple, honest pricing</h2>
          <p className="mt-3 text-center text-slate-600">GST extra · Upgrade anytime · UPI supported</p>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {planOrder.map((id) => {
              const plan = PRICING_PLANS[id];
              const highlight = plan.badge === "popular";
              return (
                <Link
                  key={id}
                  href={`/checkout?plan=${id}`}
                  className={`group relative flex flex-col rounded-2xl border p-8 bg-white transition hover:-translate-y-1 hover:shadow-xl ${
                    highlight
                      ? "border-cyan-300 pro-ring-accent"
                      : "border-slate-200 shadow-sm hover:border-cyan-200"
                  }`}
                >
                  {plan.badge === "popular" && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 px-3 py-1 text-[10px] font-bold uppercase text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">₹{plan.priceInr}</span>
                    <span className="text-sm text-slate-500">+ GST / mo</span>
                  </div>
                  <ul className="mt-8 flex-1 space-y-2 text-sm text-slate-600">
                    <li>{plan.maxUsers} users</li>
                    <li>{plan.storageGb >= 1024 ? "1 TB" : `${plan.storageGb} GB`} storage</li>
                  </ul>
                  <span
                    className={`mt-8 w-full rounded-xl py-3 text-center text-sm font-bold ${
                      highlight
                        ? "bg-gradient-to-r from-cyan-500 to-sky-500 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-800 group-hover:bg-cyan-50"
                    }`}
                  >
                    Get started
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-28 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Ready to move your business to BharatCloud?</h2>
          <p className="mt-4 text-slate-600">Join teams already securing files on {BRAND_PARENT}.</p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <ProPrimaryButton href="/signup">Create company account</ProPrimaryButton>
            <ProGhostButton href="/login">I have an account</ProGhostButton>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white py-12 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} {BRAND_PARENT} · {BRAND_PRODUCT} for Business · Made in India 🇮🇳
        </footer>
      </div>
    </div>
  );
}
