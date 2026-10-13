"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ProPageHeader, ProTableWrap } from "@/components/ui/pro/primitives";

type Company = {
  id?: string;
  domain: string;
  owner_email: string;
  employees: number;
  storage_gb: number;
  status: string;
  total_paid?: number;
  due_amount?: number;
};

export function CompaniesAdminClient() {
  const [companies, setCompanies] = useState<Company[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/companies");
    const j = await res.json();
    setCompanies(j.companies || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <ProPageHeader
        eyebrow="Platform"
        title="Companies"
        description="Tenant roster with storage, subscription status, and billing balances (INR, GST inclusive)."
        action={
          <Link
            href="/admin"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800"
          >
            Back to command center
          </Link>
        }
      />

      <ProTableWrap>
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Employees</th>
              <th className="px-4 py-3">Storage</th>
              <th className="px-4 py-3">Total paid</th>
              <th className="px-4 py-3">Due amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.domain} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium">{c.domain}</td>
                <td className="px-4 py-3 text-slate-600">{c.owner_email}</td>
                <td className="px-4 py-3">{c.employees}</td>
                <td className="px-4 py-3">{c.storage_gb} GB</td>
                <td className="px-4 py-3 font-medium text-emerald-700">
                  ₹{(c.total_paid ?? 0).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 font-medium text-amber-700">
                  ₹{(c.due_amount ?? 0).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 capitalize">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ProTableWrap>
    </div>
  );
}
