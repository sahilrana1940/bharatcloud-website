import Link from "next/link";

import { B2B_PLANS, EXTRA_ID_MONTHLY_INR } from "@/lib/b2b/plans";

export default function B2BPricingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-medium text-gray-800">BharatCloud B2B</span>
          <Link href="/b2b/login" className="text-sm text-blue-600 hover:underline">
            Admin login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Apna Private Google Drive — Delete-Proof
        </h1>
        <p className="mt-4 text-gray-600">
          Private S3 vault (Wasabi / India-ready) · Versioning ON · Soft delete only
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <PlanCard
            title="Starter"
            price={B2B_PLANS["500gb"].priceInr}
            detail={B2B_PLANS["500gb"].label}
            ctaHref="/b2b/signup?plan=500gb"
            highlight={false}
          />
          <PlanCard
            title="Growth"
            price={B2B_PLANS["1tb"].priceInr}
            detail={B2B_PLANS["1tb"].label}
            ctaHref="/b2b/signup?plan=1tb"
            highlight
          />
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Extra permanent ID: ₹{EXTRA_ID_MONTHLY_INR}/month
        </p>

        <Link
          href="/b2b/signup?plan=500gb"
          className="mt-10 inline-block rounded-full bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700"
        >
          999 me Shuru Karo
        </Link>
      </main>
    </div>
  );
}

function PlanCard({
  title,
  price,
  detail,
  ctaHref,
  highlight,
}: {
  title: string;
  price: number;
  detail: string;
  ctaHref: string;
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-8 text-left ${
        highlight ? "border-blue-600 shadow-md" : "border-gray-200"
      }`}
    >
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mt-2 text-3xl font-semibold">
        ₹{price}
        <span className="text-base font-normal text-gray-500"> + GST</span>
      </p>
      <p className="mt-4 text-sm text-gray-600">{detail}</p>
      <Link
        href={ctaHref}
        className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline"
      >
        Choose plan →
      </Link>
    </div>
  );
}
