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

  async function syncAll(type: "drive" | "gmail") {
    setMsg(type === "drive" ? "Syncing drives…" : "Syncing mail…");
    if (type === "drive") await fetch("/api/drive/sync", { method: "POST" });
    else await fetch("/api/gmail/sync", { method: "POST" });
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
          icon={<Users className="h-4 w-4 text-[#22D3EE]" />}
        />
        <ProStatCard
          label="Storage used"
          value={`${totalStorage.toFixed(1)} GB`}
          icon={<HardDrive className="h-4 w-4 text-[#22D3EE]" />}
        />
        <ProStatCard
          label="Billing"
          value="UPI / Pro"
          hint="Manage subscription"
          icon={<Wallet className="h-4 w-4 text-[#22D3EE]" />}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => syncAll("drive")}
          className="rounded-xl bg-[#22D3EE] px-4 py-2 text-sm font-bold text-slate-900"
        >
          Sync all drives
        </button>
        <button
          type="button"
          onClick={() => syncAll("gmail")}
          className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-white/80"
        >
          Sync all mail
        </button>
        <Link
          href="/dashboard/team"
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80"
        >
          Team settings
        </Link>
      </div>
      {msg && <p className="mb-4 text-sm text-[#22D3EE]">{msg}</p>}

      <ProTableWrap>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] text-xs uppercase text-white/45">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Drive</th>
              <th className="px-4 py-3">Email sync</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.email} className="border-b border-white/[0.06]">
                <td className="px-4 py-3">{m.email}</td>
                <td className="px-4 py-3 text-white/70">{m.name || "—"}</td>
                <td className="px-4 py-3 capitalize">{m.drive_sync_status || "idle"}</td>
                <td className="px-4 py-3 capitalize">{m.email_sync_status || "idle"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ProTableWrap>

      <GlassPanel className="mt-8 p-6">
        <h2 className="text-lg font-semibold">Billing & upgrades</h2>
        <p className="mt-2 text-sm text-white/55">UPI subscription and Razorpay links for your company.</p>
        <ProPrimaryButton href="/dashboard/billing" className="mt-4">
          Open billing
        </ProPrimaryButton>
      </GlassPanel>
    </div>
  );
}
