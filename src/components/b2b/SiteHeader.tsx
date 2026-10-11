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
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 text-sm font-black text-white shadow-lg shadow-cyan-500/30"
          >
            BC
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              {BRAND_PRODUCT}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-600">
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
                className="text-sm font-medium text-slate-600 transition hover:text-cyan-600"
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
              className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 sm:inline-flex hover:border-cyan-300 hover:text-cyan-700"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-500/25 hover:from-cyan-400 hover:to-sky-400"
            >
              Start free trial
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
