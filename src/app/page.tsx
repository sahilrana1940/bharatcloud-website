import Link from "next/link";

import { DarkSiteShell } from "@/components/marketing/DarkSiteShell";

export default function Pricing() {
  return (
    <DarkSiteShell active="pricing">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-5xl font-black text-white">Simple, Transparent Pricing</h1>
        <p className="text-lg text-gray-400">
          Built for Indian businesses. All plans include GST. Upgrade or cancel anytime.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="relative rounded-[24px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl transition-all hover:border-orange-500/30">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-2xl">
            🚀
          </div>
          <h2 className="text-2xl font-bold text-white">Starter</h2>
          <div className="mt-4 text-5xl font-black text-white">₹8,259</div>
          <p className="mt-2 text-sm text-gray-400">₹6,999 + GST = ₹8,259 Final</p>
          <div className="my-6 h-[1px] bg-white/10" />
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex gap-3">
              <span className="text-orange-500">✔</span> 100GB Secure Storage
            </li>
            <li className="flex gap-3">
              <span className="text-orange-500">✔</span> Up to 5 Users
            </li>
            <li className="flex gap-3">
              <span className="text-orange-500">✔</span> 99.9% Uptime SLA
            </li>
            <li className="flex gap-3">
              <span className="text-orange-500">✔</span> Email Support
            </li>
            <li className="flex gap-3">
              <span className="text-orange-500">✔</span> SSL Encryption
            </li>
          </ul>
          <Link
            href="/signup"
            className="mt-8 flex h-12 w-full items-center justify-center rounded-xl border border-orange-500/30 font-bold text-orange-400 hover:bg-orange-500/10"
          >
            Get Started
          </Link>
        </div>

        <div className="relative scale-[1.02] rounded-[24px] border-2 border-orange-500 bg-gradient-to-br from-orange-600/20 to-red-600/20 p-8 shadow-[0_0_80px_rgba(255,107,0,0.4)] backdrop-blur-xl md:scale-[1.05]">
          <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-1 text-sm font-bold text-white">
            <span>🔥</span> Most Popular
          </div>
          <h2 className="text-center text-2xl font-bold text-white">Growth</h2>
          <div className="mt-4 bg-gradient-to-r from-orange-200 to-orange-400 bg-clip-text text-center text-5xl font-black text-transparent">
            ₹23,599
          </div>
          <p className="mt-2 text-center text-sm text-orange-200/80">₹19,999 + GST = ₹23,599 Final</p>
          <div className="my-6 h-[1px] bg-orange-500/30" />
          <ul className="space-y-3 text-sm text-white">
            {[
              "500GB Secure Storage",
              "Up to 25 Users",
              "99.99% Uptime SLA",
              "Priority Support",
              "Advanced Analytics",
              "Team Collaboration",
              "API Access",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs">✔</span>
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/signup"
            className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 font-bold text-white shadow-lg hover:shadow-orange-500/50"
          >
            Start Free Trial
          </Link>
        </div>

        <div className="relative rounded-[24px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl transition-all hover:border-blue-500/30">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-2xl">
            🏢
          </div>
          <h2 className="text-2xl font-bold text-white">Enterprise</h2>
          <div className="mt-4 text-5xl font-black text-white">₹47,199</div>
          <p className="mt-2 text-sm text-gray-400">₹39,999 + GST = ₹47,199 Final</p>
          <div className="my-6 h-[1px] bg-white/10" />
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex gap-3">
              <span className="text-blue-400">✔</span> 2TB Secure Storage
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400">✔</span> Unlimited Users
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400">✔</span> 99.99% SLA Guarantee
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400">✔</span> 24/7 Dedicated Support
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400">✔</span> Dedicated Account Manager
            </li>
          </ul>
          <Link
            href="/contact"
            className="mt-8 flex h-12 w-full items-center justify-center rounded-xl border border-blue-500/30 font-bold text-blue-400 hover:bg-blue-500/10"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </DarkSiteShell>
  );
}
