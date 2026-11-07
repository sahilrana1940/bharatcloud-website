"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, otp, company: "Bharatcloud" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
        return;
      }
      alert("Workspace Created Successfully!");
      router.push("/login");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <form onSubmit={handleVerify} className="w-full max-w-md space-y-6 bg-zinc-900 p-8 rounded-2xl">
        <h1 className="text-2xl font-bold">Verify OTP</h1>
        <p className="text-zinc-400 text-sm">OTP sent to {email} / {phone}</p>
        
        <div>
          <label className="text-sm text-zinc-400">Enter 6-digit OTP</label>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="w-full mt-2 p-3 rounded-xl bg-zinc-800 border border-zinc-700 outline-none tracking-[0.5em] text-center text-xl" placeholder="121818" />
        </div>

        <button disabled={loading} type="submit" className="w-full p-3 rounded-xl bg-orange-500 text-white font-semibold">
          {loading ? "Verifying..." : "Verify & Create Workspace"}
        </button>
      </form>
    </div>
  );
}