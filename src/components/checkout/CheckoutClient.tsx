"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GST_RATE,
  planById,
  type PlanId,
  withGst,
  gstAmount,
} from "@/lib/b2b/plans";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

function CheckoutInner() {
  const params = useSearchParams();
  const router = useRouter();
  const planId = (params.get("plan") || "starter") as PlanId;
  const plan = planById(planId) ?? planById("starter")!;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = plan.priceInr;
  const gst = gstAmount(subtotal);
  const total = withGst(subtotal);

  async function pay() {
    setError("");
    setLoading(true);
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY;
    if (!key) {
      setLoading(false);
      setError(
        "Razorpay test key missing. Set NEXT_PUBLIC_RAZORPAY_KEY on Vercel.",
      );
      return;
    }

    const scriptLoaded = await loadRazorpay();
    if (!scriptLoaded || !window.Razorpay) {
      setLoading(false);
      setError("Could not load Razorpay checkout.");
      return;
    }

    const orderRes = await fetch("/api/b2b/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: plan.id }),
    });
    const order = await orderRes.json();
    if (!orderRes.ok) {
      setLoading(false);
      setError(order.error || "Order failed");
      return;
    }

    const rzp = new window.Razorpay({
      key,
      amount: total * 100,
      currency: "INR",
      name: "BharatCloud by Bharat Tijori",
      description: `${plan.name} plan (incl. GST)`,
      order_id: order.razorpayOrderId,
      handler: () => {
        router.push(`/checkout/success?plan=${plan.id}`);
      },
      theme: { color: "#0ea5e9" },
    });
    setLoading(false);
    rzp.open();
  }

  async function demoPay() {
    router.push(`/checkout/success?plan=${plan.id}&demo=1`);
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/#pricing" className="text-sm text-sky-600 hover:underline">
        ← Back to pricing
      </Link>
      <Card className="mt-6 border-slate-200/80 shadow-lg dark:border-slate-800">
        <CardHeader>
          <CardTitle>Checkout — {plan.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Plan (monthly)</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">GST ({Math.round(GST_RATE * 100)}%)</span>
            <span>₹{gst}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-4 text-base font-semibold dark:border-slate-700">
            <span>Total due today</span>
            <span>₹{total}</span>
          </div>
          <p className="text-xs text-slate-500">
            {plan.maxUsers} users · {plan.storageGb >= 1024 ? "1TB" : `${plan.storageGb}GB`} storage
          </p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button className="w-full" onClick={pay} disabled={loading}>
            {loading ? "Opening Razorpay…" : "Pay with Razorpay (test)"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-slate-600"
            onClick={demoPay}
          >
            Skip payment (demo success)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutClient() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}
