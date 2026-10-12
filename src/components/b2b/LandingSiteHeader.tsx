import Link from "next/link";

import { BRAND_PARENT, BRAND_PRODUCT } from "@/lib/brand";

/** Header for dark landing hero only */
export function LandingSiteHeader() {
  return (
    <header className="relative z-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-black text-white shadow-lg shadow-blue-500/40"
          >
            BC
          </span>
          <span className="flex flex-col leading-tight text-left">
            <span className="text-lg font-bold text-white">{BRAND_PRODUCT}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400">
              by {BRAND_PARENT}
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/35 transition hover:brightness-110"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
