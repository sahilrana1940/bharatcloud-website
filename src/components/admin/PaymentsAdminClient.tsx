"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, X } from "lucide-react";

import { ProPageHeader, ProTableWrap } from "@/components/ui/pro/primitives";
import { Toast } from "@/components/dashboard/Toast";

type Payment = {
  id: string;
  company_domain: string;
  amount: number;
  plan_name?: string;
  proof_url?: string | null;
  proof_note?: string | null;
  status: string;
  created_at: string;
};

export function PaymentsAdminClient() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/payments", { credentials: "include" });
    const j = await res.json();
    if (res.ok) setPayments(j.payments || []);
    else setToast(j.error || "Could not load payments");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(id: string, action: "approve" | "reject") {
    const res = await fetch("/api/admin/payments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ paymentId: id, action }),
    });
    if (res.ok) {
      setToast(action === "approve" ? "Plan activated for customer" : "Payment rejected");
      load();
    } else setToast("Action failed");
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div>
      <ProPageHeader
        eyebrow="Billing"
        title="UPI payment queue"
        description="Customer scans your QR, pays, pastes screenshot link (Google Drive / WhatsApp image URL), then taps Request activation. Verify proof here, then Approve."
      />

      <p className="mb-6 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-950">
        Flow: Billing → QR pay → paste proof URL → you see it below → <strong>Approve</strong> →
        their plan goes active (Drive + backup unlock).
      </p>

      <ProTableWrap>
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">₹</th>
              <th className="px-4 py-3">Proof</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                  No pending UPI payments — queue is clear.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 align-top">
                  <td className="px-4 py-3 font-medium">{p.company_domain}</td>
                  <td className="px-4 py-3">{p.plan_name || "—"}</td>
                  <td className="px-4 py-3">₹{p.amount}</td>
                  <td className="max-w-xs px-4 py-3 text-xs text-slate-600">
                    {p.proof_note ? <p className="mb-1">{p.proof_note}</p> : null}
                    {p.proof_url ? (
                      <a
                        href={p.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-cyan-700 hover:underline"
                      >
                        View screenshot <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-amber-700">No proof link yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(p.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => patch(p.id, "approve")}
                        className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => patch(p.id, "reject")}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ProTableWrap>
      <Toast message={toast} />
    </div>
  );
}
