"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HardDrive, Users, Wallet } from "lucide-react";

import { INDIA_BADGE } from "@/lib/storage/tiers";
import {
  GlassPanel,
  ProPageHeader,
  ProPrimaryButton,
  ProStatCard,
  ProTableWrap,
} from "@/components/ui/pro/primitives";

type Member = {
  email: string;
  name?: string;
  storage_used_gb?: number;
  drive_used_gb?: number;
  email_sync_status?: string;
  drive_sync_status?: string;
};

export function OwnerDashboardClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [msg, setMsg] = useState("");
  const [storage, setStorage] = useState({ hot: "0", cold: "0", vault: "0" });

  const load = useCallback(async () => {
    const res = await fetch("/api/team/users");
    const j = await res.json();
    setMembers(j.users || []);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/company/storage")
      .then((r) => r.json())
      .then((j) => {
        if (j.hotGb) setStorage({ hot: j.hotGb, cold: j.coldGb, vault: j.vaultGb });
      })
      .catch(() => undefined);
  }, [load]);

  async function syncAllDrives() {
    setMsg("Syncing drives…");
    await fetch("/api/drive/sync", { method: "POST" });
    setMsg("Sync started");
    load();
  }

  const totalStorage = members.reduce(
    (s, m) => s + (m.storage_used_gb ?? m.drive_used_gb ?? 0),
    0,
  );

  return (
    <div className="px-4 py-8 sm:px-8">
      <ProPageHeader
        eyebrow="Company owner"
        title="Command center"
        description={`Hot ${storage.hot}GB · Cold ${storage.cold}GB · Vault ${storage.vault}GB · ${INDIA_BADGE}`}
        action={
          <ProPrimaryButton href="/dashboard/company-admin">Company admin view</ProPrimaryButton>
        }
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ProStatCard
          label="Team members"
          value={String(members.length)}
          icon={<Users className="h-4 w-4 text-cyan-600" />}
        />
        <ProStatCard
          label="Storage used"
          value={`${totalStorage.toFixed(1)} GB`}
          icon={<HardDrive className="h-4 w-4 text-cyan-600" />}
        />
        <ProStatCard
          label="Billing"
          value="UPI / Pro"
          hint="Manage subscription"
          icon={<Wallet className="h-4 w-4 text-cyan-600" />}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={syncAllDrives}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-sm font-bold text-white"
        >
          Sync all drives
        </button>
        <Link
          href="/dashboard/team"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
        >
          Team settings
        </Link>
      </div>
      {msg && <p className="mb-4 text-sm text-cyan-600">{msg}</p>}

      <ProTableWrap>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Drive</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.email} className="border-b border-slate-100">
                <td className="px-4 py-3">{m.email}</td>
                <td className="px-4 py-3 text-slate-600">{m.name || "—"}</td>
                <td className="px-4 py-3 capitalize">{m.drive_sync_status || "idle"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ProTableWrap>

      <GlassPanel className="mt-8 p-6">
        <h2 className="text-lg font-semibold">Billing & upgrades</h2>
        <p className="mt-2 text-sm text-slate-600">UPI subscription and Razorpay links for your company.</p>
        <ProPrimaryButton href="/dashboard/billing" className="mt-4">
          Open billing
        </ProPrimaryButton>
      </GlassPanel>
    </div>
  );
}
