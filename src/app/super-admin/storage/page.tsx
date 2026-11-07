"use client";

import { useEffect, useState } from "react";

import { SaasShell } from "@/components/super-admin/SaasShell";

type Company = {
  id: string;
  domain?: string;
  name?: string;
  storage_used_gb?: number;
  storage_limit_gb?: number;
};

export default function StorageLogsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/companies", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (json.error) setError(json.error);
        setCompanies(json.companies || []);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <SaasShell title="Storage & Logs">
      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
      <p className="text-sm text-zinc-400">Supabase storage usage per company.</p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-zinc-400">
            <tr>
              {["Company", "Used", "Limit"].map((head) => (
                <th key={head} className="px-4 py-3">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="border-t border-white/10">
                <td className="px-4 py-3">{company.name || company.domain || company.id}</td>
                <td className="px-4 py-3">{company.storage_used_gb ?? 0} GB</td>
                <td className="px-4 py-3">{company.storage_limit_gb ?? 0} GB</td>
              </tr>
            ))}
            {!companies.length ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-zinc-500">No company storage rows.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </SaasShell>
  );
}
