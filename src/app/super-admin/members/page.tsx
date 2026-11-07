"use client";

import { useEffect, useMemo, useState } from "react";

import { SaasShell } from "@/components/super-admin/SaasShell";
import { OWNER_BADGE, OWNER_EMAIL, WEBSITE } from "@/lib/super-admin/locked-spec";

type Company = {
  id: string;
  domain?: string;
  name?: string;
  admin_email?: string;
  plan_name?: string;
  subscription_status?: string;
  storage_used_gb?: number;
  storage_limit_gb?: number;
};

function isPlatformOwner(company: Company) {
  const email = (company.admin_email || "").toLowerCase();
  const domain = `${company.domain || ""} ${company.name || ""}`.toLowerCase();
  return email === OWNER_EMAIL || domain.includes(WEBSITE);
}

export default function MembersPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
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

  const rows = useMemo(() => {
    return companies.filter((company) => {
      const shownEmail = isPlatformOwner(company) ? OWNER_EMAIL : company.admin_email || "";
      const haystack = `${company.domain || ""} ${company.name || ""} ${shownEmail}`.toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const matchesStatus = status === "all" || (company.subscription_status || "") === status;
      return matchesQuery && matchesStatus;
    });
  }, [companies, query, status]);

  return (
    <SaasShell title="Members">
      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies" className="h-11 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 text-sm" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-zinc-400">
            <tr>
              {["Company", "Email", "Plan", "Status", "Role"].map((head) => (
                <th key={head} className="px-4 py-3">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((company) => {
              const owner = isPlatformOwner(company);
              return (
                <tr key={company.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{company.name || company.domain || company.id}</td>
                  <td className="px-4 py-3">{owner ? OWNER_EMAIL : company.admin_email || "—"}</td>
                  <td className="px-4 py-3">{company.plan_name || "—"}</td>
                  <td className="px-4 py-3">{company.subscription_status || "—"}</td>
                  <td className="px-4 py-3">
                    {owner ? (
                      <span className="rounded-full bg-orange-500 px-2 py-1 text-[10px] font-bold text-black">{OWNER_BADGE}</span>
                    ) : (
                      "Member"
                    )}
                  </td>
                </tr>
              );
            })}
            {!rows.length ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">No companies match.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </SaasShell>
  );
}
