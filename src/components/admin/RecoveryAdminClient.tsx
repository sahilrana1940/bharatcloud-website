"use client";

import { useCallback, useEffect, useState } from "react";

type Req = {
  id: string;
  user_email: string;
  contact_mail: string;
  reason: string;
  created_at: string;
};

export function RecoveryAdminClient() {
  const [rows, setRows] = useState<Req[]>([]);
  const [code, setCode] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/recovery");
    const j = await res.json();
    if (res.ok) setRows(j.requests || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    const res = await fetch("/api/admin/recovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id }),
    });
    const j = await res.json();
    if (res.ok) setCode(`Code for mail: ${j.code} → ${j.contact_mail}`);
    load();
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] px-4 py-8 text-slate-100">
      <h1 className="text-2xl font-bold">Recovery requests</h1>
      {code && <p className="mt-2 text-sm text-amber-300">{code}</p>}
      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#1E2639] p-4">
            <div>
              <p className="font-medium">{r.user_email}</p>
              <p className="text-xs text-slate-400">{r.contact_mail} · {r.reason}</p>
            </div>
            <button
              type="button"
              onClick={() => approve(r.id)}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Approve
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
