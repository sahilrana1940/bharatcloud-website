"use client";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  
  const goSignup = (plan: number, price: number) => {
    router.push(`/signup?plan=${plan}&price=${price}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* NAVBAR - NO SUPER ADMIN */}
      <nav className="flex justify-between items-center px-8 py-4 border border-white/10 rounded-2xl m-4 bg-[#141414]">
        <div className="flex items-center gap-2 text-xl font-bold">
          <span className="text-orange-400">☁️</span> BharatCloud
        </div>
        <div className="flex gap-8 text-white/60">
          <span>Mumbai E2E</span>
          <span className="text-white font-semibold">Pricing</span>
        </div>
        <button 
          onClick={() => router.push('/signin')}
          className="px-6 py-2 border border-white/20 rounded-lg cursor-pointer hover:bg-white/10"
        >
          Sign in
        </button>
      </nav>

      {/* HERO */}
      <div className="text-center mt-16 px-4">
        <span className="bg-[#FF8C42] text-black px-4 py-1 rounded-full text-sm font-bold">
          MUMBAI E2E ONLY
        </span>
        <h1 className="text-6xl font-extrabold mt-4">Mumbai me safe hai</h1>
        <p className="text-white/60 mt-4 text-lg">
          Yearly archive on E2E Mumbai. Pay with Paytm. Site stays on Hostinger.
        </p>
        <div className="flex justify-center gap-4 mt-8">
          <button 
            onClick={() => goSignup(25,24999)}
            className="bg-[#FF8C42] text-black px-8 py-3 rounded-lg font-bold cursor-pointer z-10 pointer-events-auto"
          >
            Get Started →
          </button>
          <button className="border border-white/20 px-8 py-3 rounded-lg bg-[#1F1F1F] cursor-pointer">
            Talk to Sales
          </button>
        </div>
      </div>

      {/* PRICING - 3 CARDS */}
      <div className="grid grid-cols-3 gap-6 max-w-6xl mx-auto mt-16 px-6">
        {/* STARTER */}
        <div className="bg-[#1F1F1F] border border-white/10 rounded-2xl p-6">
          <p className="text-white/40 text-center">STARTER</p>
          <h2 className="text-5xl font-bold text-center mt-2">Rs 5,999</h2>
          <p className="text-center text-xs font-semibold text-emerald-400">/year · Inclusive of all taxes</p>
          <p className="text-center text-white/60">5 Users (Manual Approval)</p>
          <p className="mt-2 text-center"><span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">Shared for Team</span></p>
          <ul className="mt-6 space-y-2 text-sm">
            <li>✅ End-to-End Encrypted Email & Drive</li>
            <li>✅ 100GB Total Storage</li>
            <li>✅ Docs, Sheets & Meet</li>
            <li>✅ Paytm Payment Support</li>
            <li>✅ Yearly Archive Included</li>
          </ul>
          <button 
            onClick={() => goSignup(5,5999)}
            className="w-full mt-6 border border-white/20 py-3 rounded-lg cursor-pointer z-10 relative hover:bg-white/5"
          >
            Choose Plan
          </button>
        </div>

        {/* GROWTH - MOST POPULAR */}
        <div className="bg-[#1F1F1F] border border-[#FF4D4D] rounded-2xl p-6 shadow-[0_0_20px_rgba(255,77,77,0.3)] relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF4D4D] text-white px-3 py-1 rounded-full text-xs">
            MOST POPULAR
          </span>
          <p className="text-white/40 text-center">GROWTH</p>
          <h2 className="text-5xl font-bold text-center mt-2">Rs 24,999</h2>
          <p className="text-center text-xs font-semibold text-emerald-400">/year · Inclusive of all taxes</p>
          <p className="text-center text-white/60">25 Users (Auto)</p>
          <p className="mt-2 text-center"><span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">Shared for Team</span></p>
          <ul className="mt-6 space-y-2 text-sm">
            <li>✅ End-to-End Encrypted Email & Drive</li>
            <li>✅ 500GB Total Storage</li>
            <li>✅ Docs, Sheets, Meet & Chat</li>
            <li>✅ Priority 24x7 Support</li>
            <li>✅ Yearly Archive on Mumbai Cloud</li>
            <li>✅ Admin Control Panel</li>
          </ul>
          <button 
            onClick={() => goSignup(25,24999)}
            className="w-full mt-6 bg-gradient-to-r from-[#FF8C42] to-[#FF4D4D] text-black py-3 rounded-lg font-bold cursor-pointer z-10 relative"
          >
            Choose Plan
          </button>
        </div>

        {/* SCALE */}
        <div className="bg-[#1F1F1F] border border-white/10 rounded-2xl p-6">
          <p className="text-white/40 text-center">ENTERPRISE</p>
          <h2 className="text-5xl font-bold text-center mt-2">Rs 39,999</h2>
          <p className="text-center text-xs font-semibold text-emerald-400">/year · Inclusive of all taxes</p>
          <p className="text-center text-white/60">Unlimited (Auto)</p>
          <p className="mt-2 text-center"><span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">Shared for Team</span></p>
          <ul className="mt-6 space-y-2 text-sm">
            <li>✅ End-to-End Encrypted Email & Drive</li>
            <li>✅ 2TB Total Storage</li>
            <li>✅ Docs, Sheets, Meet & Chat</li>
            <li>✅ Dedicated Support Manager</li>
            <li>✅ Yearly Archive on Mumbai Cloud</li>
            <li>✅ SSO & Audit Logs</li>
          </ul>
          <button 
            onClick={() => goSignup(0,39999)}
            className="w-full mt-6 border border-white/20 py-3 rounded-lg cursor-pointer z-10 relative hover:bg-white/5"
          >
            Choose Plan
          </button>
        </div>
      </div>

      <p className="text-center text-white/40 text-xs mt-12 pb-8">
        All plans inclusive of taxes | GST Not Applicable | Cancel anytime
      </p>
    </div>
  );
}