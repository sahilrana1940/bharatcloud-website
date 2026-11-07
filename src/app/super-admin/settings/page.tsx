"use client";

import { SaasShell } from "@/components/super-admin/SaasShell";
import { BANK_UPI_ID, BANK_UPI_LABEL, OWNER_EMAIL, UPI_DEEP_LINK, WEBSITE } from "@/lib/super-admin/locked-spec";

export default function SettingsPage() {
  return (
    <SaasShell title="Settings">
      <div className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <label className="block text-sm">
          <span className="text-zinc-400">Website</span>
          <input value={WEBSITE} readOnly className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-white" />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Owner</span>
          <input value={OWNER_EMAIL} readOnly className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-white" />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">{BANK_UPI_LABEL}</span>
          <input value={BANK_UPI_ID} readOnly className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-white" />
          <p className="mt-2 text-xs text-zinc-500">Locked. IDFC First Bank UPI.</p>
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Deep link</span>
          <input value={UPI_DEEP_LINK} readOnly className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-white" />
        </label>
      </div>
    </SaasShell>
  );
}
