import Link from "next/link";
import { Sparkles } from "lucide-react";

export function LandingPromoBar() {
  return (
    <div className="relative overflow-hidden border-b border-orange-200/60 bg-gradient-to-r from-orange-50 via-white to-emerald-50">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.08),transparent)]" />
      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-2.5 text-center text-xs sm:text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
          <Sparkles className="h-4 w-4 text-orange-500" />
          New: Google Drive 1-click backup + UPI billing
        </span>
        <span className="hidden h-4 w-px bg-slate-300 sm:block" aria-hidden />
        <span className="text-slate-600">🇮🇳 Made in India · Mumbai-region archive</span>
        <span className="hidden h-4 w-px bg-slate-300 sm:block" aria-hidden />
        <Link
          href="/signup"
          className="font-bold text-cyan-700 underline-offset-2 hover:underline"
        >
          Start free trial →
        </Link>
      </div>
    </div>
  );
}
