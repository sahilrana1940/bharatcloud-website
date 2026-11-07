"use client";

import { Loader2, RefreshCw, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { BackupOnboarding } from "@/components/dashboard/BackupOnboarding";
import { Toast } from "@/components/dashboard/Toast";
import { openUpgradePaymentLink } from "@/lib/billing/upgrade-pro";
import { ProPageHeader, ProStatCard } from "@/components/ui/pro/primitives";

type Member = {
  id: string;
  email: string;
  name?: string;
  role?: "owner" | "admin" | "member" | string;
  drive_sync_status?: string | null;
  storage_used_gb?: number;
  drive_used_gb?: number;
  drive_limit_gb?: number;
};

type TeamStats = {
  members: number;
  storageUsedGb: number;
  storageLimitGb: number;
  activeBackups: number;
};

const EMPTY_STATS: TeamStats = { members: 0, storageUsedGb: 0, storageLimitGb: 100, activeBackups: 0 };

function initials(member: Member) {
  const source = member.name || member.email;
  return source.slice(0, 2).toUpperCase();
}

function roleLabel(role: string | undefined) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}

function driveLabel(status: string | null | undefined) {
  const value = (status || "idle").toLowerCase();
  if (value === "connected" || value === "approved" || value === "ready") return "Connected";
  if (value === "syncing") return "Syncing";
  if (value === "error" || value === "failed") return "Needs attention";
  return "Not connected";
}

function storageLabel(member: Member) {
  const used = Number(member.storage_used_gb ?? member.drive_used_gb ?? 0);
  const rawLimit = Number(member.drive_limit_gb ?? 0);
  const limit = !rawLimit || rawLimit === 15 ? 100 : rawLimit;
  const usedText = used >= 0.1 ? `${used.toFixed(1)} GB` : `${Math.max(0, used * 1024).toFixed(0)} MB`;
  return `${usedText} / ${limit} GB`;
}

export function TeamPageClient({
  canManageTeam = false,
  userEmail = "",
}: {
  canManageTeam?: boolean;
  userEmail?: string;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<TeamStats>(EMPTY_STATS);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const [globalProgress, setGlobalProgress] = useState<string | null>(null);
  const [proActive, setProActive] = useState<boolean | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyEmail, setBusyEmail] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/team/users");
    const j = await res.json();
    if (res.ok) {
      setMembers(j.users || []);
      if (j.stats) setStats(j.stats);
    }
    setReady(true);
  }, []);

  const loadBilling = useCallback(async () => {
    const res = await fetch("/api/billing/status");
    const j = await res.json();
    if (res.ok) setProActive(Boolean(j.active));
  }, []);

  useEffect(() => {
    load();
    loadBilling();
    const id = setInterval(() => {
      load();
    }, 20000);
    return () => clearInterval(id);
  }, [load, loadBilling]);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  async function upgradeToPro() {
    setUpgradeLoading(true);
    try {
      const result = await openUpgradePaymentLink({ companyEmail: userEmail, plan: "pro" });
      notify(result.ok ? "Paytm checkout opened — complete payment to unlock Pro" : result.error);
    } finally {
      setUpgradeLoading(false);
    }
  }

  async function syncDrive(email?: string) {
    notify(email ? `Drive sync started for ${email}` : "Syncing all drives…");
    setGlobalProgress(email ? `Syncing ${email}` : "Syncing all drives…");
    const res = await fetch("/api/drive/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(email ? { ownerEmail: email } : {}),
    });
    const j = await res.json();
    setGlobalProgress(null);
    notify(res.ok ? j.message || `Drive sync done (${j.filesBackedUp ?? 0} files)` : j.error || "Drive sync failed");
    load();
  }

  async function addUsers() {
    const email = addEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      notify("Enter a team email");
      return;
    }
    setAdding(true);
    const res = await fetch("/api/team/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const j = await res.json();
    setAdding(false);
    if (!res.ok) {
      notify(j.error || "Could not add member");
      return;
    }
    setAddEmail("");
    notify(j.emailSent ? `Invite sent to ${email}` : `${email} added to the team`);
    load();
  }

  async function makeAdmin(email: string) {
    setBusyEmail(email);
    const res = await fetch("/api/team/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: "admin" }),
    });
    const j = await res.json();
    setBusyEmail("");
    notify(res.ok ? `${email} is now an admin` : j.error || "Could not update role");
    load();
  }

  async function removeMember(email: string) {
    if (!confirm(`Remove ${email} from the team?`)) return;
    setBusyEmail(email);
    const res = await fetch("/api/team/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const j = await res.json();
    setBusyEmail("");
    notify(res.ok ? `${email} removed` : j.error || "Could not remove member");
    load();
  }

  const storageValue =
    stats.storageUsedGb >= 0.1
      ? `${stats.storageUsedGb.toFixed(1)} GB`
      : `${(stats.storageUsedGb * 1024).toFixed(0)} MB`;

  return (
    <div className="min-h-screen bg-transparent px-4 pb-24 pt-6 sm:px-8 lg:pb-10">
      <ProPageHeader
        eyebrow="Team"
        title="Team & backup"
        description="People in this company, their drive status, and how much storage they use."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {proActive === false ? (
              <button
                type="button"
                disabled={upgradeLoading}
                onClick={() => upgradeToPro()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#10243E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {upgradeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Upgrade to Pro
              </button>
            ) : null}
            {canManageTeam ? (
              <button
                type="button"
                onClick={() => syncDrive()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00BAF2] px-4 py-2.5 text-sm font-semibold text-[#062033]"
              >
                <RefreshCw className="h-4 w-4" /> Sync All Drives
              </button>
            ) : null}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ProStatCard label="Total Members" value={String(stats.members)} icon={<Users className="h-4 w-4 text-cyan-600" />} />
        <ProStatCard label="Storage Used" value={`${storageValue} / ${stats.storageLimitGb} GB`} />
        <ProStatCard label="Active Backups" value={String(stats.activeBackups)} />
      </div>

      {canManageTeam ? (
        <form
          className="mb-6 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            addUsers();
          }}
        >
          <input
            type="email"
            value={addEmail}
            onChange={(event) => setAddEmail(event.target.value)}
            placeholder="name@company.com"
            className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={adding}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" /> {adding ? "Sending invite…" : "Add member"}
          </button>
        </form>
      ) : null}

      <BackupOnboarding userEmail={userEmail} />

      {globalProgress ? (
        <div className="mt-6 rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-cyan-800">{globalProgress}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-sky-500 to-cyan-400" />
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-3 md:hidden">
        {members.map((member) => (
          <article key={member.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar member={member} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{member.name || member.email.split("@")[0]}</p>
                <p className="truncate text-sm text-slate-500">{member.email}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <RolePill role={member.role} />
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{driveLabel(member.drive_sync_status)}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{storageLabel(member)}</span>
            </div>
            <MemberActions
              member={member}
              canManageTeam={canManageTeam}
              busy={busyEmail === member.email}
              onSync={() => syncDrive(member.email)}
              onAdmin={() => makeAdmin(member.email)}
              onRemove={() => removeMember(member.email)}
            />
          </article>
        ))}
        {ready && members.length === 0 ? <EmptyState /> : null}
        {!ready ? <p className="py-8 text-center text-sm text-slate-500">Loading team…</p> : null}
      </div>

      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full min-w-[860px] text-left text-sm text-slate-900">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Drive Status</th>
              <th className="px-4 py-3 font-medium">Storage Used</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar member={member} />
                    <span className="font-medium">{member.name || member.email.split("@")[0]}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{member.email}</td>
                <td className="px-4 py-3"><RolePill role={member.role} /></td>
                <td className="px-4 py-3 text-slate-700">{driveLabel(member.drive_sync_status)}</td>
                <td className="px-4 py-3 text-slate-700">{storageLabel(member)}</td>
                <td className="px-4 py-3">
                  <MemberActions
                    member={member}
                    canManageTeam={canManageTeam}
                    busy={busyEmail === member.email}
                    onSync={() => syncDrive(member.email)}
                    onAdmin={() => makeAdmin(member.email)}
                    onRemove={() => removeMember(member.email)}
                  />
                </td>
              </tr>
            ))}
            {ready && members.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No team members yet. Add someone by email.
                </td>
              </tr>
            ) : null}
            {!ready ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading team…</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <Toast message={toast} />
    </div>
  );
}

function Avatar({ member }: { member: Member }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-800">
      {initials(member)}
    </span>
  );
}

function RolePill({ role }: { role?: string }) {
  const label = roleLabel(role);
  const tone =
    label === "Owner"
      ? "bg-amber-100 text-amber-800"
      : label === "Admin"
        ? "bg-cyan-100 text-cyan-800"
        : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function MemberActions({
  member,
  canManageTeam,
  busy,
  onSync,
  onAdmin,
  onRemove,
}: {
  member: Member;
  canManageTeam: boolean;
  busy: boolean;
  onSync: () => void;
  onAdmin: () => void;
  onRemove: () => void;
}) {
  if (!canManageTeam) return null;
  const isOwner = member.role === "owner";
  return (
    <div className="mt-3 flex flex-wrap gap-2 md:mt-0">
      <button type="button" onClick={onSync} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
        Sync Drive
      </button>
      {!isOwner && member.role !== "admin" ? (
        <button
          type="button"
          disabled={busy}
          onClick={onAdmin}
          className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 disabled:opacity-50"
        >
          <Shield className="h-3.5 w-3.5" /> Make Admin
        </button>
      ) : null}
      {!isOwner ? (
        <button
          type="button"
          disabled={busy}
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
      No team members yet. Add someone by email.
    </div>
  );
}
