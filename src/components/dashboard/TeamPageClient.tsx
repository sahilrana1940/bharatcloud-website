"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type User = {
  id: string;
  email: string;
  role: string;
  is_backup_enabled: boolean;
  drive_used_gb: number;
  drive_limit_gb: number;
};

export function TeamPageClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/team/users");
    const j = await res.json();
    if (res.ok) setUsers(j.users || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(id: string, enabled: boolean) {
    await fetch("/api/team/backup-toggle", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, enabled }),
    });
    load();
  }

  async function syncTeam() {
    setMsg("Syncing…");
    const res = await fetch("/api/team/sync", { method: "POST" });
    const j = await res.json();
    setMsg(res.ok ? `Synced ${j.synced} users` : j.error);
    load();
  }

  async function backupNow() {
    setMsg("Drive backup running…");
    await fetch("/api/drive/sync", { method: "POST" });
    await fetch("/api/emails/sync", { method: "POST" });
    setMsg("Backup jobs completed");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Team & backup</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={syncTeam}>
            Sync from Google
          </Button>
          <Button type="button" onClick={backupNow}>Backup Now</Button>
        </div>
      </div>
      {msg && <p className="mt-2 text-sm text-sky-600">{msg}</p>}
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b text-slate-500">
            <th className="py-2">Email</th>
            <th>Role</th>
            <th>Drive</th>
            <th>Backup</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const pct = (u.drive_used_gb / u.drive_limit_gb) * 100;
            const full = pct > 90;
            return (
              <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-3">{u.email}</td>
                <td className="capitalize">{u.role}</td>
                <td className={full ? "font-semibold text-red-600" : ""}>
                  {u.drive_used_gb}GB / {u.drive_limit_gb}GB
                  {full ? " FULL" : ""}
                </td>
                <td>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      u.is_backup_enabled
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                    onClick={() => toggle(u.id, !u.is_backup_enabled)}
                  >
                    {u.is_backup_enabled ? "ON" : "OFF"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
