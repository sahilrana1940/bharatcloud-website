import { BRAND_PARENT, BRAND_PRODUCT } from "@/lib/brand";
import { ProMeshBackground } from "@/components/ui/pro/primitives";

export function AuthMarketingPanel() {
  return (
    <div className="relative hidden min-h-screen flex-1 flex-col justify-between overflow-hidden bg-[#0A0A0B] p-10 text-white lg:flex">
      <ProMeshBackground />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#22D3EE]">
          {BRAND_PRODUCT}
        </p>
        <h2 className="mt-4 max-w-md text-4xl font-bold leading-tight">
          Apna business data,
          <span className="pro-gradient-text block">India mein safe.</span>
        </h2>
        <p className="mt-4 max-w-sm text-sm text-white/55">
          Team backup, encrypted vault, and Google Drive sync — built for Indian companies by{" "}
          {BRAND_PARENT}.
        </p>
      </div>
      <ul className="relative space-y-4 text-sm text-white/70">
        <li className="flex gap-3">
          <span className="text-[#22D3EE]">✓</span> Mumbai-region archive on Wasabi S3
        </li>
        <li className="flex gap-3">
          <span className="text-[#22D3EE]">✓</span> AES-256 tokens & role-based access
        </li>
        <li className="flex gap-3">
          <span className="text-[#22D3EE]">✓</span> UPI + Razorpay billing for teams
        </li>
      </ul>
      <p className="relative text-xs text-white/35">🇮🇳 Made in India · Enterprise-ready</p>
    </div>
  );
}
