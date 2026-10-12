import Link from "next/link";

import { BRAND_PARENT, BRAND_PRODUCT } from "@/lib/brand";

type Props = {
  variant?: "landing" | "minimal" | "dark";
};

const navLinks = [
  { href: "#features", label: "Product" },
  { href: "#pricing", label: "Pricing" },
];

export function SiteHeader({ variant = "landing" }: Props) {
  const showNav = variant === "landing" || variant === "dark";
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span
            className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl shadow-md shadow-orange-200/50 transition group-hover:scale-105"
          >
            <span
              className="absolute inset-0 bg-gradient-to-br from-orange-500 via-white to-emerald-600"
              aria-hidden
            />
            <span className="relative text-sm font-black text-slate-900">BC</span>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              {BRAND_PRODUCT}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-orange-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
              by {BRAND_PARENT}
            </span>
          </span>
        </Link>
        {showNav && (
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-600 transition hover:text-cyan-700"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        {showNav && (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 sm:inline-flex hover:border-cyan-300 hover:text-cyan-800"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-gradient-to-r from-orange-500 via-cyan-500 to-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-105"
            >
              Start free trial
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
