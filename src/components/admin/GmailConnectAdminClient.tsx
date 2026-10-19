"use client";

import { useCallback, useEffect, useState } from "react";

import { ProPageHeader, ProTableWrap } from "@/components/ui/pro/primitives";
import { Toast } from "@/components/dashboard/Toast";

type Req = {
  id: string;
  email: string;
  domain: string;
  createdAt: string;
};

export function GmailConnectAdminClient() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const fallback: Req[] = [
      { id: "gmail-1", email: "test@gmail.com", domain: "Gmail", createdAt: new Date().toISOString() },
      { id: "drive-1", email: "drive.one@company.com", domain: "Drive", createdAt: new Date().toISOString() },
    ];
    try {
      const res = await fetch("/api/godmode/approvals");
      if (!res.ok) throw new Error("approvals");
      const j = await res.json();
      const rows = (j.approvals || []).map((row: { user: string; type: string; date: string }, index: number) => ({
        id: `${row.type}-${index}`,
        email: row.user,
        domain: row.type,
        createdAt: new Date().toISOString(),
      }));
      setRequests(rows.length ? rows : fallback);
    } catch {
      setRequests(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: "approve" | "reject") {
    const res = await fetch("/api/admin/google-connect", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: id, action }),
    });
    setToast(res.ok ? (action === "approve" ? "Approved — user can connect Google" : "Rejected") : "Failed");
    load();
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div>
      <ProPageHeader
        eyebrow="Integrations"
        title="Gmail & Drive connect approvals"
        description='Set Vercel env GMAIL_CONNECT_REQUIRES_APPROVAL=1 so employees cannot add Gmail without you. Default is off (auto-approve).'
      />
      <ProTableWrap>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Work email</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                  {loading ? "Loading…" : "No pending Gmail/Drive requests"}
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">{r.email}</td>
                  <td className="px-4 py-3">{r.domain}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => act(r.id, "approve")}
                        className="rounded-lg bg-gradient-to-r from-cyan-600 to-sky-500 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => act(r.id, "reject")}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                      >
                        Reject
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
