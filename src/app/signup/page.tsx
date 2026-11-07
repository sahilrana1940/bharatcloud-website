"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendOtp = async () => {
    if (!email.trim() || !password) {
      alert("Email and Password required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          company: company.trim(),
          password,
        }),
      });
      const data = (await res.json()) as { success?: boolean; otp?: string; error?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not send OTP");
      }
      console.log("[signup-otp]", data.otp);
      alert(`OTP sent. For testing, the code is ${data.otp}`);
      setStep(2);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      alert("OTP required - Please enter OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        credentials: "same-origin",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim(), otp: otp.trim() }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Wrong OTP");
      }
      alert("Account created. You can log in now.");
      router.push("/login");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0F] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[size:32px_32px]" />
      <div className="relative w-full max-w-[480px] rounded-[24px] border border-orange-500/20 bg-[#111116] p-8">
        <h1 className="text-3xl font-black text-white">Create your workspace</h1>
        <p className="mt-2 text-sm text-gray-400">
          {step === 1 ? "Company details, then we email a code." : `Code sent to ${email}`}
        </p>

        {step === 1 ? (
          <div className="mt-8 space-y-4">
            <label className="block text-sm font-semibold text-white">
              Company
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#1A1A20] px-4 text-white outline-none focus:border-orange-500"
                placeholder="Bharatcloud"
              />
            </label>
            <label className="block text-sm font-semibold text-white">
              Work email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#1A1A20] px-4 text-white outline-none focus:border-orange-500"
                placeholder="you@company.com"
              />
            </label>
            <label className="block text-sm font-semibold text-white">
              Phone
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#1A1A20] px-4 text-white outline-none focus:border-orange-500"
                placeholder="9123456789"
              />
            </label>
            <label className="block text-sm font-semibold text-white">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#1A1A20] px-4 text-white outline-none focus:border-orange-500"
                placeholder="Password"
              />
            </label>
            <button
              type="button"
              onClick={sendOtp}
              disabled={loading}
              className="h-14 w-full rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF9F45] font-bold text-white disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            <label className="block text-sm font-semibold text-white">
              OTP
              <input
                inputMode="numeric"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-2 h-12 w-full rounded-xl border border-orange-500 bg-[#1A1A20] px-4 text-center text-lg font-bold tracking-[0.3em] text-white outline-none"
                placeholder="6 digit code"
              />
            </label>
            <button
              type="button"
              onClick={verifyOtp}
              disabled={loading}
              className="h-14 w-full rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF9F45] font-bold text-white disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-12 w-full rounded-xl bg-[#1A1A20] font-semibold text-gray-300"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
