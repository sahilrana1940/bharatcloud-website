"use client";

import { useEffect, useState } from "react";

import { SaasShell } from "@/components/super-admin/SaasShell";

type Transaction = {
  id: string;
  date: string;
  company: string;
  plan: string;
  amount: number;
  method: string;
  status: string;
};

type Overview = {
  supabase: { used: string; total: string };
  firebase: { label: string };
  monthlyBillLabel: string;
  monthlyReceived: number;
  netProfit: number;
  transactions: Transaction[];
  error?: string;
};

export default function CommandCenterPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  function load() {
    fetch("/api/super-admin/overview", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load command center");
        setData(json);
      })
      .catch((err: Error) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(row: Transaction) {
    setBusy(row.id);
    const res = await fetch("/api/super-admin/billing/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: row.id, plan: row.plan, companyId: row.company }),
    });
    setBusy("");
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Approve failed");
      return;
    }
    load();
  }

  const cards = [
    { label: "Supabase Storage", value: data ? `${data.supabase.used} / ${data.supabase.total}` : "—" },
    { label: "Firebase Usage", value: data?.firebase.label || "0 / Free tier" },
    { label: "Monthly Bill", value: data?.monthlyBillLabel || "$0", hint: "Supabase + Firebase" },
    { label: "Monthly Received", value: data ? `₹${data.monthlyReceived}` : "₹0", hint: "Bank UPI + Razorpay" },
    { label: "Net Profit", value: data ? `₹${data.netProfit}` : "₹0", profit: true },
  ];

  return (
    <SaasShell title="Command Center">
      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{card.label}</p>
            <p className={`mt-3 text-2xl font-bold ${card.profit ? "text-emerald-400" : "text-white"}`}>{card.value}</p>
            {card.hint ? <p className="mt-2 text-xs text-zinc-500">{card.hint}</p> : null}
          </article>
        ))}
      </div>

      <h2 className="mb-3 mt-10 text-lg font-semibold">Recent Transactions</h2>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-zinc-400">
            <tr>
              {["Date", "Company", "Plan", "Amount", "Method", "Status", "Action"].map((head) => (
                <th key={head} className="px-4 py-3">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.transactions || []).map((row) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="px-4 py-3">{row.date ? new Date(row.date).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3">{row.company || "—"}</td>
                <td className="px-4 py-3">{row.plan || "—"}</td>
                <td className="px-4 py-3">₹{row.amount}</td>
                <td className="px-4 py-3">{row.method}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">
                  {row.status === "pending" ? (
                    <button
                      type="button"
                      disabled={busy === row.id}
                      onClick={() => approve(row)}
                      className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-black disabled:opacity-50"
                    >
                      Approve
                    </button>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!data?.transactions?.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">No transactions yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </SaasShell>
  );
}
