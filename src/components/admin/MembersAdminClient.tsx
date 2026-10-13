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

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/members");
    const j = await res.json();
    if (res.ok) setMembers(j.members || []);
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
                  No members yet
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
