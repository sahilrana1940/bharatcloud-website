"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
    <div className="min-h-screen bg-[#0A0E1A] px-4 pb-20 pt-8 text-slate-100 sm:px-8">
      <h1 className="text-3xl font-bold">BharatCloud Super Admin</h1>
      <p className="text-slate-500">Platform overview</p>

      {stats && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Companies", stats.companies],
            ["Total Revenue (₹)", stats.revenue],
            ["Storage Used (GB)", stats.storageGb.toFixed(1)],
            ["Total Employees", stats.employees],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-[#1E2639] p-5">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-4 text-sm text-cyan-400">
        <Link href="/admin/storage" className="hover:underline">Storage tiers →</Link>
        <Link href="/admin/recovery" className="hover:underline">Recovery →</Link>
      </div>

      <div className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("companies")}
          className={`rounded-xl px-4 py-2 text-sm ${tab === "companies" ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white" : "bg-[#1E2639] text-slate-400"}`}
        >
          Companies
        </button>
        <button
          type="button"
          onClick={() => setTab("payments")}
          className={`rounded-xl px-4 py-2 text-sm ${tab === "payments" ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white" : "bg-[#1E2639] text-slate-400"}`}
        >
          Payments
        </button>
      </div>

      {tab === "companies" ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#1E2639]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
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
                <tr key={c.domain} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium">{c.domain}</td>
                  <td className="px-4 py-3">{c.owner_email}</td>
                  <td className="px-4 py-3">{c.employees}</td>
                  <td className="px-4 py-3">{c.storage_gb} GB</td>
                  <td className="px-4 py-3 capitalize">{c.status}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/vault?domain=${encodeURIComponent(c.domain)}`}
                      className="rounded-lg bg-[#1E3A5F] px-3 py-1.5 text-xs text-blue-300"
                    >
                      View Vault
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#1E2639]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-4 py-3">{p.company_domain}</td>
                  <td className="px-4 py-3">₹{p.amount}</td>
                  <td className="px-4 py-3">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => approve(p.id)}
                      className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
