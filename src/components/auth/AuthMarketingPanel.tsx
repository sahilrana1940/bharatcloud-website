import { BRAND_PARENT, BRAND_PRODUCT } from "@/lib/brand";

export function AuthMarketingPanel() {
  return (
    <div className="relative hidden min-h-screen flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-cyan-50 via-sky-50 to-indigo-50 p-10 lg:flex">
      <div className="pointer-events-none absolute inset-0 pro-mesh opacity-90" aria-hidden />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-600">
          {BRAND_PRODUCT}
        </p>
        <h2 className="mt-4 max-w-md text-4xl font-bold leading-tight text-slate-900">
          Apna business data,
          <span className="pro-gradient-text block">India mein safe.</span>
        </h2>
        <p className="mt-4 max-w-sm text-sm text-slate-600">
          Team backup, encrypted vault, and Google Drive sync — built for Indian companies by{" "}
          {BRAND_PARENT}.
        </p>
      </div>
      <ul className="relative space-y-4 text-sm text-slate-700">
        <li className="flex gap-3">
          <span className="font-bold text-cyan-600">✓</span> Mumbai-region archive on Wasabi S3
        </li>
        <li className="flex gap-3">
          <span className="font-bold text-cyan-600">✓</span> AES-256 tokens & role-based access
        </li>
        <li className="flex gap-3">
          <span className="font-bold text-cyan-600">✓</span> UPI + Razorpay billing for teams
        </li>
      </ul>
      <p className="relative text-xs text-slate-500">🇮🇳 Made in India · Enterprise-ready</p>
    </div>
  );
}
