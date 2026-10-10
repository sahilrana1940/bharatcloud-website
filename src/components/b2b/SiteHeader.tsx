import Link from "next/link";

import { BRAND_PARENT, BRAND_PRODUCT } from "@/lib/brand";

type Props = {
  variant?: "landing" | "minimal" | "dark";
};

export function SiteHeader({ variant = "landing" }: Props) {
  const dark = variant === "dark";
  return (
    <header
      className={
        dark
          ? "border-b border-white/10 bg-slate-950/50 backdrop-blur-xl"
          : "border-b border-gray-100 bg-white/90 backdrop-blur"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white ${
              dark ? "bg-gradient-to-br from-sky-500 to-blue-600" : ""
            }`}
            style={dark ? undefined : { backgroundColor: "#ff6a00" }}
          >
            BC
          </span>
          <span className="flex flex-col leading-tight">
            <span
              className={`text-lg font-semibold tracking-tight ${
                dark ? "text-white" : "text-gray-900"
              }`}
            >
              {BRAND_PRODUCT}
            </span>
            <span
              className={`text-[10px] font-medium uppercase tracking-wider ${
                dark ? "text-sky-400/90" : "text-[#ff6a00]"
              }`}
            >
              by {BRAND_PARENT}
            </span>
          </span>
        </Link>
        {(variant === "landing" || variant === "dark") && (
          <nav className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className={
                dark
                  ? "rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
                  : "rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:border-[#ff6a00]/40 hover:text-[#ff6a00]"
              }
            >
              Login
            </Link>
            <Link
              href="/signup"
              className={
                dark
                  ? "rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-sky-500/20"
                  : "rounded-full bg-[#ff6a00] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#e55f00]"
              }
            >
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
