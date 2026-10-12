"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { BRAND_PARENT, BRAND_PRODUCT } from "@/lib/brand";
import { LandingSiteHeader } from "@/components/b2b/LandingSiteHeader";

export function LandingHero() {
  return (
    <section className="relative min-h-[88vh] overflow-hidden bg-[#020617] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_35%,rgba(30,64,175,0.45),transparent_60%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_35%_at_50%_100%,rgba(14,165,233,0.12),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent"
        aria-hidden
      />

      <LandingSiteHeader />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center justify-center px-6 pb-24 pt-10 text-center sm:min-h-[calc(88vh-88px)] sm:pb-32 sm:pt-16">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-medium uppercase tracking-[0.22em] text-sky-300/95"
        >
          {BRAND_PRODUCT} B2B · {BRAND_PARENT}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
        >
          Apna Business Cloud,
          <span className="mt-2 block bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text font-bold text-transparent">
            India Me Safe
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-slate-300"
        >
          Apni team ki files manage karo — premium storage built for Indian companies.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-10"
        >
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-10 py-3.5 text-sm font-semibold text-white shadow-[0_0_32px_rgba(59,130,246,0.5)] transition hover:shadow-[0_0_48px_rgba(59,130,246,0.65)] hover:brightness-110"
          >
            Start Free Trial
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
