"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { ProPageHeader, ProTableWrap } from "@/components/ui/pro/primitives";
import { Toast } from "@/components/dashboard/Toast";

type Member = {
  id: string;
  email: string;
  domain: string;
  role: string;
  googleConnectStatus: string;
  createdAt: string;
};

export function MembersAdminClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const fallback: Member[] = [
      {
        id: "1",
        email: "you@company.com",
        domain: "Acme Pvt Ltd",
        role: "20 IDs Rs12999",
        googleConnectStatus: "Active",
        createdAt: new Date().toISOString(),
      },
    ];
    try {
      const res = await fetch("/api/godmode/workspaces");
      if (!res.ok) throw new Error("workspaces");
      const j = await res.json();
      const rows = (j.workspaces || []).map((row: {
        id: number;
        name: string;
        email: string;
        plan: string;
        status: string;
      }) => ({
        id: String(row.id),
        email: row.email,
        domain: row.name,
        role: row.plan,
        googleConnectStatus: row.status || "Active",
        createdAt: new Date().toISOString(),
      }));
      setMembers(rows.length ? rows : fallback);
    } catch {
      setMembers(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string, email: string) {
    if (!confirm(`Remove ${email} from workspace? They will lose access.`)) return;
    const res = await fetch("/api/admin/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: id }),
    });
    setToast(res.ok ? "Member removed" : "Remove failed");
    load();
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div>
      <ProPageHeader
        eyebrow="Access control"
        title="All workspace members"
        description="Super admin can remove any member email from any company tenant."
      />
      <ProTableWrap>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Gmail gate</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  {loading ? "Loading members…" : "No members yet"}
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium">{m.email}</td>
                  <td className="px-4 py-3">{m.domain}</td>
                  <td className="px-4 py-3 capitalize">{m.googleConnectStatus.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => remove(m.id, m.email)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
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
