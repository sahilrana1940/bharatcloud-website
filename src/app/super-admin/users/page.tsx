"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "@/components/super-admin/AdminShell";

export default function SuperAdminUsersPage() {
  const [members, setMembers] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/stats-real", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 403) throw new Error("403 Forbidden");
        if (!res.ok) throw new Error("Users request failed");
        return res.json();
      })
      .then((data) => setMembers(Number(data.members || 0)))
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AdminShell active="Settings">
      <h1 className="text-3xl font-semibold tracking-tight text-white">Users</h1>
      <p className="mt-1 text-sm text-zinc-500">{members} members real</p>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#111113] text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="px-4 py-8 text-zinc-500">
                No data yet - Real from Razorpay/E2E
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
