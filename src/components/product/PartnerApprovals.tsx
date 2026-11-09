"use client";

import { useEffect, useState } from "react";

import { Shell } from "@/components/product/Shell";

type PartnerUser = {
  name: string;
  email: string;
  mobile: string;
  whatsapp: string;
  state: string;
  city: string;
  status: string;
} | null;

type PendingPartner = {
  id: string;
  created_at?: string;
  user: PartnerUser;
};

export function PartnerApprovals() {
  const [rows, setRows] = useState<PendingPartner[]>([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState("");

  async function load() {
    const response = await fetch("/api/product/super");
    const body = await response.json();
    if (!response.ok) {
      setError(body.error || "Requests nahi khuli.");
      return;
    }
    setError("");
    setRows((body.partners || []).filter((partner: PendingPartner) => partner.user?.status === "pending"));
  }

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);

  async function review(partnerId: string, decision: "approve" | "reject") {
    setBusyId(partnerId);
    setNote("");
    const response = await fetch("/api/product/super", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "review", partnerId, decision }),
    });
    const body = await response.json();
    setBusyId("");
    if (!response.ok) {
      setError(body.error || "Action fail.");
      return;
    }
    setNote(decision === "approve" ? "Partner approve ho gaya." : "Partner reject ho gaya.");
    if (body.whatsapp) window.open(body.whatsapp, "_blank", "noopener,noreferrer");
    await load();
  }

  return (
    <Shell title="Partner Requests" role="Super Admin">
      <p className="mb-4 text-sm text-[#5c5348]">Saari pending partner requests. Approve ya Reject ek click me.</p>
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      {note ? <p className="mb-3 text-sm text-[#0f6b4c]">{note}</p> : null}
      {rows.length === 0 ? <p className="rounded-3xl bg-white p-5 text-sm">Koi pending request nahi.</p> : null}
      <div className="space-y-3">
        {rows.map((partner) => (
          <article key={partner.id} className="rounded-3xl bg-white p-5">
            <p className="text-lg font-semibold">{partner.user?.name}</p>
            <p className="mt-1 text-sm">{partner.user?.email}</p>
            <p className="text-sm">Mobile {partner.user?.mobile} · WhatsApp {partner.user?.whatsapp}</p>
            <p className="text-sm">{partner.user?.city}, {partner.user?.state}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={busyId === partner.id}
                onClick={() => review(partner.id, "approve")}
                className="rounded-full bg-[#0f6b4c] px-4 py-2 text-sm font-semibold text-white"
              >
                Approve
              </button>
              <button
                disabled={busyId === partner.id}
                onClick={() => review(partner.id, "reject")}
                className="rounded-full border border-[#1c1915] px-4 py-2 text-sm font-semibold"
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}
