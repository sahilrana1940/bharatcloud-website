"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  role: string | null;
  drive_used_gb: number | null;
};

type TenantRow = {
  id: string;
  domain: string | null;
  plan_name: string | null;
  subscription_status: string | null;
  admin_email: string | null;
};

type Payload = {
  users: number;
  tenants: number;
  message: string | null;
  userRows: UserRow[];
  tenantRows: TenantRow[];
};

export default function SuperAdminUsersPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/super-admin/stats-real", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 403) throw new Error("Forbidden — support@bharatcloud.store only");
        if (!res.ok) throw new Error("Users request failed");
        return res.json();
      })
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  const users = data?.userRows || [];
  const tenants = data?.tenantRows || [];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">Users</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {data ? `${data.tenants} tenants · ${data.users} users` : "0 tenants · 0 users"}
      </p>
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      {data?.message ? <p className="mt-4 text-sm text-zinc-400">{data.message}</p> : null}

      <h2 className="mt-8 text-sm font-semibold text-white">Tenants</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Admin</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-zinc-500">
                  No data yet - Real from Razorpay/E2E
                </td>
              </tr>
            ) : (
              tenants.map((row) => (
                <tr key={row.id} className="border-t border-zinc-800">
                  <td className="px-4 py-3">{row.domain || "—"}</td>
                  <td className="px-4 py-3">{row.plan_name || "—"}</td>
                  <td className="px-4 py-3">{row.subscription_status || "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">{row.admin_email || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-white">Company users</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Drive GB</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-zinc-500">
                  No data yet - Real from Razorpay/E2E
                </td>
              </tr>
            ) : (
              users.map((row) => (
                <tr key={row.id} className="border-t border-zinc-800">
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{row.role || "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{Number(row.drive_used_gb || 0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
