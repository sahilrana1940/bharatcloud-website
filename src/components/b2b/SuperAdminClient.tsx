"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { formatStorageGb, planLabel } from "@/lib/b2b/plans";
import { SUPER_ADMIN_EMAIL } from "@/lib/b2b/constants";

type OrgRow = {
  id: string;
  name: string;
  owner_email: string;
  plan: string;
  storage_limit: number;
  storage_used: number;
  status: string;
  memberCount: number;
};

export function SuperAdminClient({ authed }: { authed: boolean }) {
  const [email, setEmail] = useState(SUPER_ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(authed);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [error, setError] = useState("");

  const loadOrgs = useCallback(async () => {
    const res = await fetch("/api/b2b/super/orgs");
    if (!res.ok) return;
    const j = await res.json();
    setOrgs(j.orgs || []);
  }, []);

  useEffect(() => {
    if (loggedIn) loadOrgs();
  }, [loggedIn, loadOrgs]);

  async function login() {
    setError("");
    const res = await fetch("/api/b2b/auth/super", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await res.json();
    if (!res.ok) {
      setError(j.error || "Login failed");
      return;
    }
    setLoggedIn(true);
    loadOrgs();
  }

  async function patchOrg(
    orgId: string,
    patch: { plan?: string; storage_limit?: number; status?: string },
  ) {
    const res = await fetch("/api/b2b/super/orgs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, ...patch }),
    });
    if (res.ok) loadOrgs();
  }

  if (!loggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold">Super Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Restricted access</p>
          <input
            className="mt-6 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={login}
            className="mt-4 w-full rounded-full bg-[#ff6a00] py-2.5 text-sm font-semibold text-white"
          >
            Login
          </button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <Link href="/" className="mt-6 block text-center text-sm text-[#ff6a00]">
            ← Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="font-semibold">Super Admin — All companies</h1>
          <Link href="/" className="text-sm text-[#ff6a00]">Home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl overflow-x-auto px-6 py-8">
        <table className="min-w-full rounded-xl border border-gray-200 bg-white text-left text-sm shadow-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Storage</th>
              <th className="px-4 py-3">Members</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium">{o.name}</td>
                <td className="px-4 py-3">{o.owner_email}</td>
                <td className="px-4 py-3">{planLabel(o.plan)}</td>
                <td className="px-4 py-3">
                  {formatStorageGb(o.storage_used)} / {formatStorageGb(o.storage_limit)}
                </td>
                <td className="px-4 py-3">{o.memberCount}</td>
                <td className="px-4 py-3 capitalize">{o.status}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="text-[#ff6a00] hover:underline"
                      onClick={() => {
                        const plan = prompt("Plan (free/starter/growth/enterprise)", o.plan);
                        if (plan) patchOrg(o.id, { plan });
                      }}
                    >
                      Edit plan
                    </button>
                    <button
                      type="button"
                      className="text-[#ff6a00] hover:underline"
                      onClick={() => {
                        const gb = prompt("Storage limit GB", String(o.storage_limit / 1024 ** 3));
                        if (gb) patchOrg(o.id, { storage_limit: Number(gb) * 1024 ** 3 });
                      }}
                    >
                      Edit limit
                    </button>
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() =>
                        patchOrg(o.id, {
                          status: o.status === "blocked" ? "active" : "blocked",
                        })
                      }
                    >
                      {o.status === "blocked" ? "Unblock" : "Block"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
