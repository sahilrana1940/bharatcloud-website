// app/page.tsx - BharatCloud - 3 Pages in ONE (Dark + Light Best Converting)
import Link from "next/link";
import React from "react";

export default function BharatCloudLanding() {
  return (
    <div className="font-sans antialiased">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'); body{font-family:'Inter',sans-serif}`}</style>

      {/* NAV - DARK */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-8 py-4 bg-[#09090b]/90 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center gap-2 text-white font-bold text-xl">
          <span className="text-2xl">☁️</span> BharatCloud
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#features" className="hover:text-white">Email backup</a>
          <a href="#drive" className="hover:text-white">Drive</a>
          <a href="#pricing" className="hover:text-white text-white">Pricing</a>
          <Link href="/login" className="hover:text-white">bharatcloud.drive</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden md:block px-4 py-2 text-sm border border-zinc-700 rounded-lg text-white">Log in</Link>
          <Link href="/signup" className="px-4 py-2 text-sm bg-white text-black rounded-lg font-semibold">Get Started</Link>
        </div>
      </nav>

      {/* PAGE 1 - HERO - DARK bg-[#09090b] */}
      <section className="bg-[#09090b] text-white px-6 md:px-8 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-block text-xs border border-zinc-800 px-3 py-1.5 rounded-full mb-6 text-zinc-300">
            bharatcloud.drive
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] mb-6">Email backup<br />with Drive</h1>
          <p className="text-zinc-300 text-lg md:text-xl mb-3">Mail archive and Drive files, Mumbai me safe hai.</p>
          <p className="text-zinc-500 text-sm md:text-[15px] mb-8 max-w-[520px] leading-relaxed">
            BharatCloud Drive keeps company Gmail and Google Drive in one Indian backup. Mail is archived. Drive files stay in Mumbai. Restore when you need them.
          </p>
          <div className="flex gap-4 mb-12">
            <Link href="/signup" className="bg-white text-black px-6 py-3 rounded-lg font-semibold text-sm">Start mail backup</Link>
            <Link href="/login" className="border border-zinc-800 px-6 py-3 rounded-lg text-sm text-white">Open bharatcloud.drive</Link>
          </div>
          <div className="flex gap-10 text-sm">
            <div><div className="text-white font-bold text-lg">Email</div><div className="text-zinc-500 text-xs">Mail backup</div></div>
            <div><div className="text-white font-bold text-lg">Drive</div><div className="text-zinc-500 text-xs">Files in Mumbai</div></div>
            <div><div className="text-white font-bold text-lg">Restore</div><div className="text-zinc-500 text-xs">When you need it</div></div>
          </div>
        </div>

        {/* Hero Right - India Card */}
        <div className="relative bg-[#121214] border border-zinc-800 rounded-2xl p-6 min-h-[520px] flex flex-col justify-between overflow-hidden">
          <div className="absolute top-6 right-6 bg-[#1c1c1f] border border-zinc-800 px-3 py-2.5 rounded-lg text-xs shadow-xl">
            <div className="font-semibold text-white">✉️ Mail backup</div><div className="text-zinc-400 text-[11px]">Gmail archived in Mumbai</div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-7xl mb-3 opacity-90">📬</div>
              <div className="inline-flex items-center gap-2 bg-black border border-zinc-800 px-3 py-1.5 rounded-full text-xs">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> bharatcloud.drive • Mumbai
              </div>
            </div>
          </div>
          <div className="absolute bottom-24 right-6 bg-[#1c1c1f] border border-zinc-800 px-3 py-2.5 rounded-lg text-xs shadow-xl">
            <div className="font-semibold text-white">📁 Drive files</div><div className="text-zinc-400 text-[11px]">Backup and restore</div>
          </div>
          <div className="flex justify-start">
            <div className="text-[11px] border border-zinc-800 px-3 py-1.5 rounded-full text-zinc-400 bg-[#1a1a1d]">SOC 2 • ISO 27001 • MeitY Compliant</div>
          </div>
        </div>
      </section>

      {/* PAGE 2 - FEATURES - DARK */}
      <section id="features" className="scroll-mt-20 bg-[#09090b] border-t border-zinc-800 px-6 md:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Email backup and Drive</h2>
          <p className="text-zinc-400">bharatcloud.drive — company mail and Drive files, archived in Mumbai.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto">
          <div className="bg-white text-black p-6 rounded-xl">
            <div className="text-2xl mb-3">✉️</div>
            <div className="font-bold leading-tight">Email mail backup</div>
            <p className="text-sm text-zinc-600 mt-2 leading-relaxed">Connect Gmail and archive company mail. Search it later and restore a message when someone needs it.</p>
          </div>
          <div id="drive" className="bg-white text-black p-6 rounded-xl scroll-mt-24">
            <div className="text-2xl mb-3">📁</div>
            <div className="font-bold">Drive on bharatcloud.drive</div>
            <p className="text-sm text-zinc-600 mt-2">Google Drive files backed up next to mail. One Indian drive for the company.</p>
          </div>
          <div className="bg-white text-black p-6 rounded-xl">
            <div className="text-2xl mb-3">🛡️</div>
            <div className="font-bold leading-tight">DPDP Act 2023<br />compliant</div>
            <p className="text-sm text-zinc-600 mt-2">Aligned with India&apos;s Digital Personal Data Protection Act 2023. Privacy and consent-first design.</p>
          </div>
          <div className="bg-white text-black p-6 rounded-xl">
            <div className="text-2xl mb-3">🏷️</div>
            <div className="font-bold leading-tight">70% cheaper than<br />Google Workspace</div>
            <p className="text-sm text-zinc-600 mt-2">Same productivity tools, fraction of the cost. Transparent pricing, no hidden fees.</p>
          </div>
          <div className="bg-white text-black p-6 rounded-xl">
            <div className="text-2xl mb-3">📅</div>
            <div className="font-bold">Yearly mail archive</div>
            <p className="text-sm text-zinc-600 mt-2">Mail backup is kept as a yearly archive in Mumbai. Restorable, not deleted on day one.</p>
          </div>

          {/* 6th SPECIAL - WHY INDIA */}
          <div id="why-india" className="scroll-mt-24 bg-gradient-to-br from-orange-500 to-green-600 text-white p-6 rounded-xl">
            <div className="font-bold text-[15px]">🇮🇳 Bharat ka data, Bharat me</div>
            <p className="text-sm mt-2 leading-relaxed opacity-95">
              US clouds ka data USA jata hai (CLOUD Act). BharatCloud ka data kabhi India se bahar nahi jata. Govt tenders, banks ke liye mandatory.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="bg-white/20 px-2 py-1 rounded-full">DPDP + MeitY Certified</span>
              <span className="bg-white/20 px-2 py-1 rounded-full">Rupee billing</span>
              <span className="bg-white/20 px-2 py-1 rounded-full">Indian support</span>
            </div>
          </div>
        </div>
        <p className="text-center text-zinc-500 text-xs mt-10">bharatcloud.drive — email backup and Drive files for Indian companies.</p>
      </section>

      {/* PAGE 3 - PRICING - LIGHT BEST CONVERTING */}
      <section id="pricing" className="scroll-mt-20 bg-[#f8fafc] text-[#0f172a] px-6 md:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold">Simple, Transparent Pricing for Indian B2B</h2>
          <p className="text-zinc-600 mt-3 text-sm md:text-[15px]">Email backup and Drive on bharatcloud.drive. Your mail and files stay in Mumbai, India.</p>
          <div className="inline-block mt-5 border border-blue-200 text-blue-700 text-xs md:text-sm px-4 py-1.5 rounded-full bg-blue-50/50">
            Based in Mumbai | India Data Residence | Inclusive of all taxes
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-12 items-start">
          {/* Starter */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
            <h3 className="text-center text-lg font-medium">Starter</h3>
            <div className="text-center mt-2">
              <span className="text-5xl font-extrabold text-[#0f172a] tracking-tight">₹5,999</span>
              <span className="text-sm text-zinc-500">/year</span>
            </div>
            <p className="text-center text-xs font-semibold text-emerald-700 mt-1">Inclusive of all taxes</p>
            <p className="text-center mt-3"><span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">Shared for Team</span></p>
            <p className="text-center text-sm text-zinc-600 mt-3">For small teams & startups</p>
            <ul className="mt-6 space-y-2.5 text-[13px]">
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> 100GB Total Storage</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> 5 Users (Manual Approval)</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> Email mail backup</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> bharatcloud.drive files</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> Basic Analytics & Reporting</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> Email Support (Business Hours)</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> Mumbai Data Center</li>
            </ul>
            <Link href="/signup" className="block w-full mt-8 bg-[#0f172a] text-white py-3 rounded-full font-semibold text-sm text-center">Get Started</Link>
          </div>

          {/* Growth - MOST POPULAR - BLUE BEST */}
          <div className="bg-white border-2 border-[#2563eb] rounded-2xl p-8 shadow-xl relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#2563eb] text-white px-6 py-1 text-xs font-bold tracking-wide rounded-full">MOST POPULAR</div>
            <h3 className="text-center text-lg font-bold text-[#1e40af]">Growth</h3>
            <div className="text-center mt-2">
              <span className="text-5xl font-extrabold text-[#1e3a8a] tracking-tight">₹24,999</span>
              <span className="text-sm text-zinc-500">/year</span>
            </div>
            <p className="text-center text-xs font-semibold text-emerald-700 mt-1">Inclusive of all taxes</p>
            <p className="text-center mt-3"><span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">Shared for Team</span></p>
            <p className="text-center text-sm text-zinc-600 mt-3">For growing businesses & SMEs</p>
            <ul className="mt-6 space-y-2.5 text-[13px]">
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> 500GB Total Storage</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> 25 Users (Auto)</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> Advanced Analytics & Insights</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> Priority 24/7 Support</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> Custom Integrations & API Access</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> Team Collaboration Tools</li>
            </ul>
            <Link href="/signup" className="block w-full mt-8 bg-[#0f172a] text-white py-3 rounded-full font-semibold text-sm text-center">Get Started</Link>
          </div>

          {/* Enterprise */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
            <h3 className="text-center text-lg font-medium">Enterprise</h3>
            <div className="text-center mt-2">
              <span className="text-5xl font-extrabold text-[#0f172a] tracking-tight">₹39,999</span>
              <span className="text-sm text-zinc-500">/year</span>
            </div>
            <p className="text-center text-xs font-semibold text-emerald-700 mt-1">Inclusive of all taxes</p>
            <p className="text-center mt-3"><span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">Shared for Team</span></p>
            <p className="text-center text-sm text-zinc-600 mt-3">For enterprises & large teams</p>
            <ul className="mt-6 space-y-2.5 text-[13px]">
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> 2TB Total Storage</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> Unlimited (Auto)</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> Dedicated Account Manager</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> SLA 99.9% Uptime Guarantee</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> Advanced Security & SSO</li>
              <li className="flex gap-2"><span className="text-[#2563eb]">✓</span> Custom Deployment & Onboarding</li>
            </ul>
            <Link href="/signup" className="block w-full mt-8 bg-[#0f172a] text-white py-3 rounded-full font-semibold text-sm text-center">Get Started</Link>
          </div>
        </div>

        {/* Footer trust */}
        <div className="max-w-6xl mx-auto mt-12 bg-[#f1f5f9] rounded-xl p-4">
          <div className="flex flex-wrap justify-center gap-3 text-[11px] md:text-xs text-zinc-600">
            <span>Trusted by 5000+ Indian Businesses</span><span>•</span><span>ISO 27001</span><span>•</span><span>MeitY Compliant</span><span>•</span><span>99.9% Uptime</span><span>•</span><span>24/7 Indian Support</span><span>•</span><span>Razorpay Secure Payments</span>
          </div>
          <div className="text-center text-[11px] text-zinc-500 mt-3">All plans inclusive of taxes | GST Not Applicable | Cancel anytime</div>
        </div>
      </section>

      <footer className="bg-[#09090b] text-zinc-500 text-center py-8 text-xs border-t border-zinc-800">
        © 2026 BharatCloud Drive — email backup and Drive. Mumbai me safe hai.
        <p className="mt-2">All plans inclusive of taxes | GST Not Applicable | Cancel anytime</p>
      </footer>
    </div>
  );
}