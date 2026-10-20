"use client";

import { useEffect, useState } from "react";

type Infra = { vm: number; storage: number; bandwidth: number; total: number };

export default function SuperAdminInfrastructurePage() {
  const [infra, setInfra] = useState<Infra | null>(null);
  const [storageGb, setStorageGb] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/stats-real", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 403) throw new Error("Forbidden — support@bharatcloud.store only");
        if (!res.ok) throw new Error("Infrastructure request failed");
        return res.json();
      })
      .then((data) => {
        setInfra(data.infra);
        setStorageGb(Number(data.storageGb || 0));
        setMessage(data.message || "");
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const rows = [
    { label: "VM", value: infra?.vm ?? 0 },
    { label: "Storage", value: infra?.storage ?? 0 },
    { label: "Bandwidth", value: infra?.bandwidth ?? 0 },
    { label: "Total", value: infra?.total ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">Infrastructure</h1>
      <p className="mt-1 text-sm text-zinc-500">Fixed Mumbai E2E cost in INR. Storage used comes from company users.</p>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-6">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{row.label} INR</p>
            <p className="mt-3 text-4xl font-semibold tabular-nums">{row.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-6">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">E2E storage used (GB)</p>
        <p className="mt-3 text-4xl font-semibold tabular-nums">{storageGb}</p>
        {message ? <p className="mt-3 text-sm text-zinc-400">{message}</p> : null}
      </div>
    </div>
  );
}
