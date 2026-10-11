"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Building2, IndianRupee, HardDrive, Users } from "lucide-react";

import {
  ProPageHeader,
  ProPrimaryButton,
  ProStatCard,
  ProTableWrap,
} from "@/components/ui/pro/primitives";

type Stats = {
  companies: number;
  revenue: number;
  storageGb: number;
  employees: number;
};

type Company = {
  id?: string;
  domain: string;
  owner_email: string;
  employees: number;
  storage_gb: number;
  status: string;
};

type Payment = {
  id: string;
  company_domain: string;
  amount: number;
  created_at: string;
};

export function AdminDashboardClient() {
  const [tab, setTab] = useState<"companies" | "payments">("companies");
  const [stats, setStats] = useState<Stats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const load = useCallback(async () => {
    const [s, c, p] = await Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/companies").then((r) => r.json()),
      fetch("/api/admin/payments").then((r) => r.json()),
    ]);
    setStats(s);
    setCompanies(c.companies || []);
    setPayments(p.payments || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    await fetch("/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: id }),
    });
    load();
  }

  return (
    <div>
      <ProPageHeader
        eyebrow="BharatCloud"
        title="Platform admin"
        description="Companies, payments, and storage — manage the whole fleet from one console."
        action={<ProPrimaryButton href="/admin/super">Open Nexus Super</ProPrimaryButton>}
      />

      {stats && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ProStatCard
            label="Companies"
            value={String(stats.companies)}
            icon={<Building2 className="h-4 w-4 text-cyan-600" />}
          />
          <ProStatCard
            label="Revenue"
            value={`₹${stats.revenue.toLocaleString()}`}
            icon={<IndianRupee className="h-4 w-4 text-cyan-600" />}
          />
          <ProStatCard
            label="Storage"
            value={`${stats.storageGb.toFixed(1)} GB`}
            icon={<HardDrive className="h-4 w-4 text-cyan-600" />}
          />
          <ProStatCard
            label="Employees"
            value={String(stats.employees)}
            icon={<Users className="h-4 w-4 text-cyan-600" />}
          />
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {(["companies", "payments"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
              tab === t
                ? "bg-gradient-to-r from-cyan-500 to-sky-500 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:text-slate-900"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "companies" ? (
        <ProTableWrap>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Employees</th>
                <th className="px-4 py-3">Storage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.domain} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">{c.domain}</td>
                  <td className="px-4 py-3 text-slate-600">{c.owner_email}</td>
                  <td className="px-4 py-3">{c.employees}</td>
                  <td className="px-4 py-3">{c.storage_gb} GB</td>
                  <td className="px-4 py-3 capitalize">{c.status}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/vault?domain=${encodeURIComponent(c.domain)}`}
                      className="rounded-lg bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700"
                    >
                      View vault
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ProTableWrap>
      ) : (
        <ProTableWrap>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">{p.company_domain}</td>
                  <td className="px-4 py-3">₹{p.amount}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(p.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => approve(p.id)}
                      className="rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 px-3 py-1.5 text-xs font-bold text-white"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ProTableWrap>
      )}
    </div>
  );
}
