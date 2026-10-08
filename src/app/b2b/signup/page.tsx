"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { B2B_PLANS, type B2BPlanId } from "@/lib/b2b/plans";

function SignupForm() {
  const params = useSearchParams();
  const plan = (params.get("plan") as B2BPlanId) || "500gb";
  const selected = B2B_PLANS[plan];
  const [companyName, setCompanyName] = useState("");
  const [status, setStatus] = useState("");

  async function checkout() {
    setStatus("Creating Razorpay order…");
    const res = await fetch("/api/b2b/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, companyName }),
    });
    const j = await res.json();
    if (!res.ok) {
      setStatus(j.error || "Checkout failed");
      return;
    }
    setStatus(
      `Order ${j.orderId} · ₹${j.amountInr}+GST · Razorpay ${
        j.razorpayKeyConfigured ? "ready" : "(set RAZORPAY_KEY)"
      }`,
    );
    window.location.href = j.checkoutUrl;
  }

  return (
    <div className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-semibold">B2B Signup</h1>
        <p className="mt-2 text-gray-600">{selected.label}</p>
        <input
          className="mt-6 w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="Company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
        <button
          type="button"
          onClick={checkout}
          className="mt-4 w-full rounded-full bg-blue-600 py-3 text-white hover:bg-blue-700"
        >
          Pay ₹{selected.priceInr}+GST · Razorpay
        </button>
        {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
        <Link href="/b2b" className="mt-6 inline-block text-sm text-blue-600">
          ← Back to pricing
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
