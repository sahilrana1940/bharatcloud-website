"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, CreditCard, HardDrive, Shield } from "lucide-react";

type TenantRow = {
  id: string;
  domain: string;
  owner_email: string;
  employees: number;
  storage_gb: number;
  status: string;
  plan_paid?: boolean;
  paytm_txn?: string | null;
};

export function SuperAdminTenantsDashboard({ adminEmail }: { adminEmail: string }) {
  const [rows, setRows] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/platform/tenants", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Forbidden");
        return r.json();
      })
      .then((j) => setRows(j.tenants || []))
      .catch(() => setError("Could not load tenant list"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#10243E]">
      <header className="border-b border-[#10243E]/10 bg-[#10243E] px-6 py-5 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-[#7DD3C7]">Platform super admin</p>
        <h1 className="mt-1 text-2xl font-semibold">All tenant Admins</h1>
        <p className="mt-1 text-sm text-white/70">{adminEmail} · Hostinger · E2E bharatcloudfinal2 · Paytm</p>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/admin/payments"
            className="inline-flex items-center gap-2 rounded-full bg-[#00BAF2] px-4 py-2 text-sm font-semibold text-[#062033]"
          >
            <CreditCard className="h-4 w-4" />
            Payments
          </Link>
          <Link
            href="/admin/members"
            className="inline-flex items-center gap-2 rounded-full border border-[#10243E]/20 bg-white px-4 py-2 text-sm font-semibold"
          >
            <Building2 className="h-4 w-4" />
            Members
          </Link>
        </div>

        {loading && <p className="text-slate-500">Loading Admins…</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="overflow-x-auto rounded-2xl border border-[#10243E]/10 bg-white shadow-sm">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-[#F4EFE6] text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Admin email</th>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Rent (Paytm)</th>
                <th className="px-4 py-3">Storage</th>
                <th className="px-4 py-3">Employees</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{t.owner_email}</td>
                  <td className="px-4 py-3">{t.domain}</td>
                  <td className="px-4 py-3">
                    {t.plan_paid ? (
                      <span className="text-emerald-700">Paid ✓</span>
                    ) : (
                      <span className="text-amber-700">{t.status || "Pending"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{t.paytm_txn || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      <HardDrive className="h-3.5 w-3.5" />
                      {t.storage_gb.toFixed(1)} GB
                    </span>
                  </td>
                  <td className="px-4 py-3">{t.employees}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/members?domain=${encodeURIComponent(t.domain)}`}
                      className="mr-2 text-[#0F766E] underline"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      className="text-slate-500"
                      onClick={() => window.alert("Suspend — use /admin recovery for production")}
                    >
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !rows.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No tenant Admins yet. Admins appear after signup + Paytm on the website.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-6 flex items-center gap-2 text-xs text-slate-500">
          <Shield className="h-4 w-4" />
          God Mode is closed on the public site. This view is only for {adminEmail}.
        </p>
      </main>
    </div>
  );
}
