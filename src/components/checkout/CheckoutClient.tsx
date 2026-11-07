"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  planById,
  type PlanId,
  withGst,
  gstAmount,
} from "@/lib/b2b/plans";
import { BANK_UPI_LABEL, UPI_DEEP_LINK, UPI_QR_URL } from "@/lib/super-admin/locked-spec";

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
    const link = `${UPI_DEEP_LINK}&am=${total}&tn=${encodeURIComponent(plan.name)}`;
    setLoading(true);
    window.location.href = link;
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/pricing" className="text-sm text-sky-600 hover:underline">
        ← Back to pricing
      </Link>
      <Card className="mt-6 border-slate-200/80 shadow-lg dark:border-slate-800">
        <CardHeader>
          <CardTitle>Checkout — {plan.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Plan (yearly, inclusive)</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">GST Not Applicable</span>
            <span>₹{gst}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-4 text-base font-semibold dark:border-slate-700">
            <span>Total due today</span>
            <span>₹{total}</span>
          </div>
          <p className="text-xs text-slate-500">
            {plan.maxUsers ? `${plan.maxUsers} users` : "Unlimited users"} · {plan.storageGb >= 1024 ? `${plan.storageGb / 1024}TB` : `${plan.storageGb}GB`} Total Storage · inclusive of taxes
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={UPI_QR_URL} alt="Direct Bank UPI QR" className="mx-auto rounded-xl bg-white p-2" width={180} height={180} />
          <p className="text-xs text-slate-500">IDFC First Bank UPI · 9469276461@idfcfirst</p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button className="w-full bg-[#10243E] text-white hover:bg-[#10243E]/90" onClick={pay} disabled={loading}>
            {loading ? "Opening UPI…" : BANK_UPI_LABEL}
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
