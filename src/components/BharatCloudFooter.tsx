import Link from "next/link";

import { BRAND_FOOTER, BRAND_PRODUCT } from "@/lib/brand";

export function BharatCloudFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0A0A0B] px-6 py-10 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#22D3EE]">{BRAND_PRODUCT}</p>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-white/45">{BRAND_FOOTER}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-white/50">
          <Link href="/login" className="hover:text-[#22D3EE]">Login</Link>
          <Link href="/signup" className="hover:text-[#22D3EE]">Sign up</Link>
          <Link href="/#pricing" className="hover:text-[#22D3EE]">Pricing</Link>
        </div>
      </div>
    </footer>
  );
}
