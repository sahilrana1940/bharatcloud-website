"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { rupee } from "@/lib/product/money";
import { Shell, Stat } from "@/components/product/Shell";

type PartnerUser = { name: string; email: string; mobile: string; whatsapp: string; state: string; city: string; status: string } | null;

type Overview = {
  stats: { partners: number; companies: number; revenuePaise: number; pendingApprovals: number; pendingCommissionPaise: number };
  partners: { id: string; payment_status: string; total_ids: number; total_gb: number; user: PartnerUser }[];
  companies: { id: string; name: string; payment_status: string; allocated_ids: number; allocated_gb: number }[];
  payments: { id: string; amount_paise: number; upi_ref: string; status: string; kind: string }[];
  commissions: { id: string; amount_paise: number; status: string }[];
};

export function SuperHome() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/product/super");
    const body = await response.json();
    if (!response.ok) setError(body.error || "Dashboard nahi khula.");
    else setData(body);
  }

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);

  async function act(payload: object) {
    const response = await fetch("/api/product/super", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || "Action fail.");
      return;
    }
    if (body.whatsapp) window.open(body.whatsapp, "_blank", "noopener,noreferrer");
    await load();
  }

  return (
    <Shell title="Super Admin" role="Super Admin">
      <Link href="/hub/approvals" className="mb-4 inline-block rounded-full bg-[#0f6b4c] px-4 py-2 text-sm font-semibold text-white">
        Partner Requests
      </Link>
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      {data ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Total Partners" value={String(data.stats.partners)} />
            <Stat label="Total Companies" value={String(data.stats.companies)} />
            <Stat label="Total Revenue" value={rupee(data.stats.revenuePaise)} />
            <Stat label="Pending Approve" value={String(data.stats.pendingApprovals)} />
          </div>
          <section className="rounded-3xl bg-white p-5">
            <h2 className="font-semibold">Pending partners</h2>
            <div className="mt-3 space-y-3">
              {data.partners.filter((partner) => partner.user?.status === "pending").length === 0 ? <p className="text-sm">Koi pending request nahi.</p> : null}
              {data.partners.filter((partner) => partner.user?.status === "pending").map((partner) => (
                <article key={partner.id} className="rounded-2xl border p-3 text-sm">
                  <p className="font-semibold">{partner.user?.name} · {partner.user?.city}, {partner.user?.state}</p>
                  <p>{partner.user?.email} · {partner.user?.whatsapp}</p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => act({ action: "review", partnerId: partner.id, decision: "approve" })} className="rounded-full bg-[#0f6b4c] px-3 py-1 text-white">Approve</button>
                    <button onClick={() => act({ action: "review", partnerId: partner.id, decision: "reject" })} className="rounded-full border px-3 py-1">Reject</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="rounded-3xl bg-white p-5">
            <h2 className="font-semibold">Payments</h2>
            <div className="mt-3 space-y-2 text-sm">
              {data.payments.length === 0 ? <p>Abhi payment nahi aayi.</p> : null}
              {data.payments.map((payment) => (
                <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2">
                  <span>{payment.kind} · {rupee(payment.amount_paise)} · {payment.upi_ref} · {payment.status}</span>
                  {payment.status === "pending" ? (
                    <button onClick={() => act({ action: "confirm-payment", paymentId: payment.id })} className="rounded-full bg-[#1c1915] px-3 py-1 text-white">Confirm</button>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-3xl bg-white p-5">
            <h2 className="font-semibold">Companies</h2>
            <p className="mt-1 text-xs text-[#7a5b32]">Files aur email backup yahan nahi dikhte.</p>
            <ul className="mt-3 space-y-2 text-sm">
              {data.companies.map((company) => (
                <li key={company.id}>{company.name} · {company.allocated_ids} ID · {company.allocated_gb} GB · {company.payment_status}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl bg-white p-5 text-sm">
            <h2 className="font-semibold">Partner commission</h2>
            <p className="mt-1">Pending {rupee(data.stats.pendingCommissionPaise)}</p>
            {data.commissions.filter((row) => row.status === "pending").map((row) => (
              <div key={row.id} className="mt-2 flex items-center justify-between">
                <span>{rupee(row.amount_paise)}</span>
                <button onClick={() => act({ action: "pay-commission", commissionId: row.id })} className="rounded-full border px-3 py-1">Mark paid</button>
              </div>
            ))}
          </section>
        </div>
      ) : null}
    </Shell>
  );
}
