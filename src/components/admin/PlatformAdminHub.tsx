"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  IndianRupee,
  Mail,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { ProPageHeader, ProStatCard, ProTableWrap } from "@/components/ui/pro/primitives";

type CostLine = { vendor: string; purpose: string; amountInr: number };

type Finance = {
  revenueInr: number;
  monthlyCostsInr: number;
  netInr: number;
  pendingPayments: number;
  approvedPayments: number;
  costLines?: CostLine[];
};

type Stats = {
  companies: number;
  revenue: number;
  storageGb: number;
  employees: number;
};

export function PlatformAdminHub() {
  const [finance, setFinance] = useState<Finance | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    const [f, s] = await Promise.all([
      fetch("/api/admin/finance-summary").then((r) => r.json()),
      fetch("/api/admin/stats").then((r) => r.json()),
    ]);
    setFinance(f);
    setStats(s);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const netPositive = (finance?.netInr ?? 0) >= 0;

  return (
    <div className="space-y-8">
      <ProPageHeader
        eyebrow="BharatCloud · Platform operator"
        title="Command center"
        description="UPI QR approvals, member access, Gmail connect gate, revenue vs infra cost — one console for the whole product."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/payments"
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25"
            >
              Approve UPI payments
            </Link>
            <Link
              href="/admin/super"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800"
            >
              Nexus metrics
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ProStatCard
          label="Total earned (approved UPI)"
          value={`₹${(finance?.revenueInr ?? stats?.revenue ?? 0).toLocaleString("en-IN")}`}
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
        />
        <ProStatCard
          label="Monthly infra cost (est.)"
          value={`₹${(finance?.monthlyCostsInr ?? 0).toLocaleString("en-IN")}`}
          icon={<TrendingDown className="h-4 w-4 text-amber-600" />}
        />
        <ProStatCard
          label="Net (earn − cost)"
          value={`₹${(finance?.netInr ?? 0).toLocaleString("en-IN")}`}
          icon={<Wallet className="h-4 w-4 text-cyan-600" />}
        />
        <ProStatCard
          label="Pending UPI approvals"
          value={String(finance?.pendingPayments ?? 0)}
          icon={<IndianRupee className="h-4 w-4 text-violet-600" />}
        />
      </div>

      <p
        className={`rounded-xl border px-4 py-3 text-sm ${
          netPositive
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
      >
        {netPositive
          ? "Revenue is ahead of estimated monthly hosting cost. Update cost lines in code when invoices change."
          : "Costs exceed approved payments so far — normal early stage. Approve paid customers via UPI screenshot flow."}
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickCard
          href="/admin/payments"
          title="UPI + QR approvals"
          body="Customer pays via QR, pastes screenshot link, you Approve here. No Razorpay required."
          cta="Open payments queue"
        />
        <QuickCard
          href="/admin/members"
          title="Members & remove access"
          body="See every workspace email. Remove a user if they left the company or abuse access."
          cta="Manage members"
        />
        <QuickCard
          href="/admin/gmail"
          title="Gmail / Drive gate"
          body="When GMAIL_CONNECT_REQUIRES_APPROVAL=1 on Vercel, new Google connects wait for your OK."
          cta="Gmail requests"
        />
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <ProStatCard
            label="Companies"
            value={String(stats.companies)}
            icon={<Building2 className="h-4 w-4 text-cyan-600" />}
          />
          <ProStatCard
            label="Workspace members"
            value={String(stats.employees)}
            icon={<Users className="h-4 w-4 text-cyan-600" />}
          />
          <ProStatCard
            label="Vault storage (sum)"
            value={`${stats.storageGb.toFixed(1)} GB`}
            icon={<Mail className="h-4 w-4 text-cyan-600" />}
          />
        </div>
      )}

      {finance?.costLines?.length ? (
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">Your monthly bills (edit in platform-costs.ts)</h2>
          <ProTableWrap>
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">₹/month</th>
                </tr>
              </thead>
              <tbody>
                {finance.costLines.map((line: { vendor: string; purpose: string; amountInr: number }) => (
                  <tr key={line.vendor} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium">{line.vendor}</td>
                    <td className="px-4 py-3 text-slate-600">{line.purpose}</td>
                    <td className="px-4 py-3">₹{line.amountInr.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ProTableWrap>
        </section>
      ) : null}
    </div>
  );
}

function QuickCard({
  href,
  title,
  body,
  cta,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300 hover:shadow-md"
    >
      <h3 className="font-bold text-slate-900 group-hover:text-cyan-800">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
      <span className="mt-4 inline-block text-sm font-semibold text-cyan-700">{cta} →</span>
    </Link>
  );
}
