import Link from "next/link";

import { AuthMarketingPanel } from "@/components/auth/AuthMarketingPanel";
import { LoginForm } from "@/components/auth/LoginForm";
import { BRAND_PARENT, BRAND_PRODUCT } from "@/lib/brand";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] lg:flex-row">
      <AuthMarketingPanel />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-6 py-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-xs font-black text-white">
              BC
            </span>
            <span className="text-sm font-bold text-slate-900">{BRAND_PRODUCT}</span>
          </Link>
          <Link href="/signup" className="text-sm font-semibold text-cyan-700">Sign up</Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
            <div className="mb-6 hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600">Sign in</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Welcome back</h1>
              <p className="mt-1 text-sm text-slate-500">Your company workspace on {BRAND_PARENT}</p>
            </div>
            <div className="mb-4 lg:hidden">
              <h1 className="text-xl font-bold text-slate-900">Sign in</h1>
              <p className="text-sm text-slate-500">Work email & password</p>
            </div>
            <LoginForm />
          </div>
        </div>

        <p className="pb-6 text-center text-xs text-slate-400 lg:hidden">
          🇮🇳 {BRAND_PRODUCT} for Business · Made in India
        </p>
      </div>
    </div>
  );
}
