import Link from "next/link";

import { planById } from "@/lib/b2b/plans";

type Props = {
  searchParams: Promise<{ plan?: string; demo?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { plan: planId } = await searchParams;
  const plan = planById(planId || "starter") ?? planById("starter")!;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-sky-950 to-slate-950 px-6 text-center text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl">
        <p className="text-sm uppercase tracking-widest text-sky-300">Payment successful</p>
        <h1 className="mt-4 text-3xl font-semibold">Welcome to {plan.name}</h1>
        <p className="mt-2 text-slate-300">
          Your workspace is ready. Complete setup in the dashboard.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-8 py-3 text-sm font-semibold"
        >
          Go to dashboard
        </Link>
        <Link href="/" className="mt-4 block text-sm text-slate-400 hover:text-white">
          Back to home
        </Link>
      </div>
    </div>
  );
}
