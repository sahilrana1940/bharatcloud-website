import Link from "next/link";

import { BRAND_FOOTER, BRAND_PRODUCT } from "@/lib/brand";

export function BharatCloudFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-cyan-600">{BRAND_PRODUCT}</p>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-500">{BRAND_FOOTER}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-slate-600">
          <Link href="/login" className="hover:text-cyan-600">Login</Link>
          <Link href="/signup" className="hover:text-cyan-600">Sign up</Link>
          <Link href="/#pricing" className="hover:text-cyan-600">Pricing</Link>
        </div>
      </div>
    </footer>
  );
}
