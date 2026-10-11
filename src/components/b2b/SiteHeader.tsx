import Link from "next/link";

import { BRAND_PARENT, BRAND_PRODUCT } from "@/lib/brand";

type Props = {
  variant?: "landing" | "minimal" | "dark";
};

const navLinks = [
  { href: "#features", label: "Product" },
  { href: "#pricing", label: "Pricing" },
  { href: "/login", label: "Login" },
];

export function SiteHeader({ variant = "landing" }: Props) {
  const dark = variant === "dark" || variant === "landing";
  return (
    <header
      className={
        dark
          ? "sticky top-0 z-50 border-b border-white/[0.08] bg-[#0A0A0B]/80 backdrop-blur-xl"
          : "border-b border-gray-100 bg-white/90 backdrop-blur"
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#22D3EE] text-sm font-black text-slate-900 shadow-lg shadow-cyan-500/30"
          >
            BC
          </span>
          <span className="flex flex-col leading-tight">
            <span className={`text-lg font-bold tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>
              {BRAND_PRODUCT}
            </span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                dark ? "text-[#22D3EE]" : "text-cyan-600"
              }`}
            >
              by {BRAND_PARENT}
            </span>
          </span>
        </Link>
        {(variant === "landing" || variant === "dark") && (
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.slice(0, 2).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-white/70 transition hover:text-[#22D3EE]"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        {(variant === "landing" || variant === "dark") && (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white sm:inline-flex hover:bg-white/5"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-[#22D3EE] px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-cyan-500/25 hover:bg-cyan-300"
            >
              Start free trial
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
