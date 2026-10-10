"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import { formatStorageGb, planLabel } from "@/lib/b2b/plans";

type Org = {
  name: string;
  plan: string;
  storage_limit: number;
  storage_used: number;
};

type Member = {
  id: string;
  user_email: string;
  role: string;
  joined_at: string;
};

export function DashboardClient() {
  const [org, setOrg] = useState<Org | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [message, setMessage] = useState("");

  const [usedBytes, setUsedBytes] = useState(0);
  const [limitBytes, setLimitBytes] = useState(1);

  const refresh = useCallback(async () => {
    const [orgRes, membersRes, storageRes] = await Promise.all([
      fetch("/api/b2b/org"),
      fetch("/api/b2b/members"),
      fetch("/api/b2b/storage"),
    ]);
    if (storageRes.ok) {
      const s = await storageRes.json();
      setUsedBytes(s.usedBytes ?? 0);
      setLimitBytes(s.limitBytes ?? 1);
    }
    if (orgRes.ok) {
      const j = await orgRes.json();
      setOrg(j.org);
      setMemberCount(j.memberCount ?? 0);
    }
    if (membersRes.ok) {
      const j = await membersRes.json();
      setMembers(j.members || []);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addMember() {
    if (!email.includes("@")) {
      setMessage("Enter a valid email");
      return;
    }
    const res = await fetch("/api/b2b/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail: email, role }),
    });
    const j = await res.json();
    if (!res.ok) {
      setMessage(j.error || "Failed to add member");
      return;
    }
    setEmail("");
    setMessage(`Added ${j.member?.user_email || email}`);
    refresh();
  }

  async function removeMember(id: string) {
    const res = await fetch("/api/b2b/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: id }),
    });
    if (!res.ok) {
      const j = await res.json();
      setMessage(j.error || "Delete failed");
      return;
    }
    refresh();
  }

  const limit = limitBytes || org?.storage_limit || 1;
  const used = usedBytes || org?.storage_used || 0;
  const pct = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <BrandMark
            href="/"
            titleClass="text-gray-900"
            accentClass="text-[#ff6a00]"
          />
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-[#ff6a00]"
          >
            Account
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Storage used">
            <p className="text-lg font-semibold">
              {formatStorageGb(used)} / {formatStorageGb(limit)}
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#ff6a00]"
                style={{ width: `${pct}%` }}
              />
            </div>
          </StatCard>
          <StatCard title="Total members">
            <p className="text-3xl font-semibold">{memberCount}</p>
          </StatCard>
          <StatCard title="Plan">
            <p className="text-3xl font-semibold capitalize">
              {org ? planLabel(org.plan) : "—"}
            </p>
            <Link
              href="/#pricing"
              className="mt-2 inline-block text-sm font-medium text-[#ff6a00] hover:underline"
            >
              Upgrade plan →
            </Link>
          </StatCard>
        </div>

        <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Add team member</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="button"
              onClick={addMember}
              className="rounded-full bg-[#ff6a00] px-6 py-2 text-sm font-semibold text-white hover:bg-[#e55f00]"
            >
              Add
            </button>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <h2 className="border-b border-gray-100 px-6 py-4 text-lg font-semibold">
            Members
          </h2>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-gray-100">
                  <td className="px-6 py-3">{m.user_email}</td>
                  <td className="px-6 py-3 capitalize">{m.role}</td>
                  <td className="px-6 py-3">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    <button
                      type="button"
                      onClick={() => removeMember(m.id)}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No members yet — add your team above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-gray-800">Company files</h2>
          <p className="mt-2 text-gray-600">
            Company Files — Coming from Mobile App
          </p>
        </section>

        {message && (
          <p className="mt-4 rounded-lg bg-orange-50 px-4 py-2 text-sm text-orange-900">
            {message}
          </p>
        )}
      </main>
    </div>
  );
}

function StatCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
