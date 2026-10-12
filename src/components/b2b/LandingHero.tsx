"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { BRAND_PARENT, BRAND_PRODUCT } from "@/lib/brand";
import { LandingSiteHeader } from "@/components/b2b/LandingSiteHeader";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[#030712] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_20%,rgba(37,99,235,0.35),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_0%,rgba(34,211,238,0.15),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent"
        aria-hidden
      />

      <LandingSiteHeader />

      <div className="relative mx-auto max-w-4xl px-6 pb-28 pt-12 text-center sm:pb-36 sm:pt-20">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300/90 sm:text-sm"
        >
          {BRAND_PRODUCT} B2B · {BRAND_PARENT}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="mt-8 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Apna Business Cloud,
          <span className="mt-2 block bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
            India Me Safe
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mx-auto mt-8 max-w-2xl text-base text-slate-300 sm:text-lg md:text-xl"
        >
          Apni team ki files manage karo — premium storage, Google Drive backup, and UPI billing
          built for Indian companies.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Link
            href="/signup"
            className="group relative inline-flex w-full max-w-sm items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-400 px-10 py-4 text-base font-bold text-white shadow-[0_0_40px_rgba(56,189,248,0.45)] transition hover:shadow-[0_0_56px_rgba(56,189,248,0.55)] sm:w-auto"
          >
            Start Free Trial
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full max-w-sm items-center justify-center rounded-xl border border-white/20 bg-white/5 px-10 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 sm:w-auto"
          >
            Sign in
          </Link>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 sm:text-sm"
        >
          <li>🇮🇳 Made in India</li>
          <li>·</li>
          <li>256-bit vault</li>
          <li>·</li>
          <li>Plans from ₹999/mo</li>
          <li>·</li>
          <li>UPI & Razorpay</li>
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mx-auto mt-14 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:p-5"
        >
          <p className="text-left text-[10px] font-semibold uppercase tracking-widest text-sky-300/80">
            Live workspace
          </p>
          <div className="mt-3 grid gap-2 text-left font-mono text-xs text-slate-300 sm:grid-cols-3 sm:gap-3 sm:text-[11px]">
            <span className="rounded-lg bg-sky-500/10 px-3 py-2 border border-sky-500/20">
              Owner → Team & billing
            </span>
            <span className="rounded-lg bg-amber-500/10 px-3 py-2 border border-amber-500/20">
              Employee → Backup
            </span>
            <span className="rounded-lg bg-emerald-500/10 px-3 py-2 border border-emerald-500/20">
              Admin → Nexus
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
