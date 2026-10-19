"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { paytmDeepLink } from "@/lib/billing/paytm";

function CheckoutInner() {
  const params = useSearchParams();
  const planId = (params.get("plan") || "starter") as PlanId;
  const plan = planById(planId) ?? planById("starter")!;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = plan.priceInr;
  const gst = gstAmount(subtotal);
  const total = withGst(subtotal);

  function pay() {
    setError("");
    const link = paytmDeepLink(total, `${plan.name} Bharat Cloud`);
    if (!link) {
      setError("Paytm VPA missing. Set NEXT_PUBLIC_PAYTM_UPI_ID.");
      return;
    }
    setLoading(true);
    window.location.href = link;
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
            {plan.maxUsers} users · {plan.storageGb >= 1024 ? "1TB" : `${plan.storageGb}GB`} on E2E Mumbai · site on Hostinger
          </p>
          <p className="text-xs text-slate-500">Paytm only. Cards and netbanking are not accepted.</p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button className="w-full bg-[#00BAF2] text-[#062033] hover:bg-[#00BAF2]/90" onClick={pay} disabled={loading}>
            {loading ? "Opening Paytm…" : "Pay with Paytm"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function CheckoutClient() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  );
}
