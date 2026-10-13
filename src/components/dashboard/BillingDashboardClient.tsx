"use client";

import Link from "next/link";
import { IndianRupee, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BillingClient } from "@/components/dashboard/BillingClient";
import { Toast } from "@/components/dashboard/Toast";
import {
  GlassPanel,
  ProPageHeader,
  ProPrimaryButton,
  ProTableWrap,
} from "@/components/ui/pro/primitives";
import { getUpiLink } from "@/lib/billing/plans";

type UsageRow = {
  id: string;
  date: string;
  service: string;
  units: number;
  amount: number;
};

type UsagePayload = {
  month: string;
  usedInr: number;
  capInr: number;
  percent: number;
  b3StorageGb?: number;
  b3StorageInr?: number;
  rows: UsageRow[];
};

const RAZORPAY_TEST_URL =
  process.env.NEXT_PUBLIC_RAZORPAY_TEST_LINK?.trim() ||
  "https://razorpay.com/docs/payments/payments/test-card-upi-details/";

export function BillingDashboardClient() {
  const [usage, setUsage] = useState<UsagePayload | null>(null);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [dueInr, setDueInr] = useState(0);

  const load = useCallback(async () => {
    const [usageRes, statusRes, invoiceRes] = await Promise.all([
      fetch("/api/billing/usage").then((r) => r.json()),
      fetch("/api/billing/status").then((r) => r.json()),
      fetch("/api/billing/invoice").then((r) => r.json()),
    ]);
    setUsage(usageRes);
    setSubscriptionActive(Boolean(statusRes.active));
    const cap = usageRes.capInr ?? 1999;
    const used = usageRes.usedInr ?? invoiceRes?.invoice?.totalInr ?? 0;
    setDueInr(Math.max(0, cap - used));
    if (!usageRes.rows?.length && usageRes.error) {
      setToast(usageRes.error);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upiLink = useMemo(
    () => getUpiLink(dueInr > 0 ? dueInr : usage?.capInr ?? 1999, "Monthly usage"),
    [dueInr, usage?.capInr],
  );

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    upiLink,
  )}`;

  const used = usage?.usedInr ?? 843;
  const cap = usage?.capInr ?? 1999;
  const percent = usage?.percent ?? Math.round((used / cap) * 100);

  return (
    <div className="min-h-screen overflow-y-auto bg-transparent px-4 pb-[140px] pt-6 sm:px-8 lg:pb-10">
      <ProPageHeader
        eyebrow="Workspace"
        title="Billing"
        description="Monthly bill includes Bharat Big Bucket (b3) storage from your B3 files — same meter as the B3 Storage page."
        action={
          <ProPrimaryButton type="button" onClick={() => setPayOpen(true)}>
            Pay now
          </ProPrimaryButton>
        }
      />

      <GlassPanel className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">Current month usage</p>
            <p className="mt-1 flex items-baseline gap-1 text-3xl font-bold text-slate-900">
              <IndianRupee className="h-7 w-7 text-cyan-600" aria-hidden />
              {used.toLocaleString("en-IN")}
              <span className="text-lg font-semibold text-slate-400">
                / ₹{cap.toLocaleString("en-IN")}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">GST inclusive · {percent}% of monthly cap</p>
            {typeof usage?.b3StorageGb === "number" ? (
              <p className="mt-2 text-sm text-slate-600">
                <Link href="/dashboard/storage" className="font-semibold text-cyan-700 underline">
                  B3 bucket
                </Link>
                : {usage.b3StorageGb.toFixed(1)} GB → ₹
                {(usage.b3StorageInr ?? 0).toLocaleString("en-IN")} this month
              </p>
            ) : null}
          </div>
          <div className="w-full sm:max-w-xs">
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-right text-sm font-semibold text-cyan-700">{percent}%</p>
          </div>
        </div>
      </GlassPanel>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Usage detail</h2>
        <ProTableWrap>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(usage?.rows ?? []).map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-600">
                    {r.date ? new Date(r.date).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {r.service === "b3"
                      ? `b3 · ${(usage?.b3StorageGb ?? r.units).toFixed(1)} GB`
                      : r.service}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">₹{r.amount}</td>
                </tr>
              ))}
              {!usage?.rows?.length ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    Loading usage…
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </ProTableWrap>
      </div>

      {!subscriptionActive ? (
        <div className="mt-12 border-t border-slate-200 pt-10">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Activate subscription</h2>
          <p className="mb-6 text-sm text-slate-600">
            Pick a plan to unlock automatic backup after UPI approval.
          </p>
          <BillingClient embedded />
        </div>
      ) : (
        <p className="mt-8 text-sm text-emerald-700">
          Subscription active — usage above is for this billing period. Pay now settles any balance
          via UPI or Razorpay test checkout.
        </p>
      )}

      {payOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-modal-title"
        >
          <GlassPanel className="relative max-w-md w-full p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setPayOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 id="pay-modal-title" className="text-xl font-bold text-slate-900">
              Pay with UPI
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Scan with PhonePe / GPay — ₹{(dueInr > 0 ? dueInr : used).toLocaleString("en-IN")}{" "}
              (GST incl.)
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="PhonePe UPI QR"
              className="mx-auto mt-4 rounded-xl border border-slate-200 bg-white p-3"
              width={240}
              height={240}
            />
            <p className="mt-3 text-center text-xs text-slate-500">BharatCloud · UPI collect QR</p>
            <div className="mt-6 flex flex-col gap-2">
              <a
                href={upiLink}
                className="flex items-center justify-center rounded-xl bg-[#5f259f] py-3 text-sm font-bold text-white"
              >
                Open in PhonePe
              </a>
              <a
                href={RAZORPAY_TEST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800"
              >
                Razorpay test checkout
              </a>
            </div>
          </GlassPanel>
        </div>
      ) : null}

      <Toast message={toast} />
    </div>
  );
}
