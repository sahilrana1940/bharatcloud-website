"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const companyId = params.get("company") || "";
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp() {
    setError("");
    const res = await fetch("/api/b2b/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const j = await res.json();
    if (!res.ok) {
      setError(j.error || "Failed");
      return;
    }
    setSent(true);
  }

  async function verify() {
    setError("");
    const res = await fetch("/api/b2b/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp, companyId }),
    });
    const j = await res.json();
    if (!res.ok) {
      setError(j.error || "Invalid OTP");
      return;
    }
    router.push("/b2b/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900">B2B Admin OTP</h1>
        <p className="mt-1 text-sm text-gray-500">Single admin login only</p>
        <input
          className="mt-6 w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="+91 phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {!sent ? (
          <button
            type="button"
            onClick={sendOtp}
            className="mt-3 w-full rounded-full bg-blue-600 py-2.5 text-white"
          >
            Send OTP
          </button>
        ) : (
          <>
            <input
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="OTP (demo: 123456)"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button
              type="button"
              onClick={verify}
              className="mt-3 w-full rounded-full bg-blue-600 py-2.5 text-white"
            >
              Verify & open dashboard
            </button>
          </>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export default function B2BLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
