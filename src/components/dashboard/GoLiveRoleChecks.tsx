"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

import { GlassPanel } from "@/components/ui/pro/primitives";

type UserRow = { email: string; role: string; name?: string };

const STEPS = [
  "Login at bharatcloud.store/login",
  "Settings → Google Drive connected",
  "Employee home → Start my backup (or upload/vault)",
] as const;

export function GoLiveRoleChecks({ adminEmail }: { adminEmail: string }) {
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    fetch("/api/team/users")
      .then((r) => r.json())
      .then((j) => setUsers(j.users || []))
      .catch(() => undefined);
  }, []);

  const owner = users.find((u) => u.email.toLowerCase() === adminEmail.toLowerCase()) ?? {
    email: adminEmail,
    role: "admin",
    name: "Owner",
  };
  const realEmployees = users.filter(
    (u) => u.email.toLowerCase() !== adminEmail.toLowerCase(),
  );
  const employees: UserRow[] = [];
  for (let i = 0; i < 3; i++) {
    employees.push(
      realEmployees[i] ?? {
        email: `Staff slot ${i + 1} — invite on Team`,
        role: "member",
        name: "Pending invite",
      },
    );
  }

  function RoleBlock({ title, u }: { title: string; u: UserRow }) {
    const placeholder = u.email.startsWith("Staff slot");
    return (
      <li className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{title}</p>
        <p className={`mt-1 font-medium ${placeholder ? "text-slate-400" : "text-slate-900"}`}>
          {u.email}
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
          {STEPS.map((step) => (
            <li key={step} className="flex items-start gap-2">
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
              {step}
            </li>
          ))}
        </ul>
      </li>
    );
  }

  return (
    <GlassPanel className="mt-8 p-6">
      <h2 className="text-lg font-semibold text-slate-900">Go-live checks (owner + 3 employees)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Demo se pehle har account par ye teen steps verify karein. Team page se staff invite karein.
      </p>
      <ul className="mt-6 space-y-4">
        <RoleBlock title="Owner / admin" u={owner} />
        {employees.map((u, i) => (
          <RoleBlock key={`emp-${i}`} title={`Employee ${i + 1}`} u={u} />
        ))}
      </ul>
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        Print-friendly copy: <code className="rounded bg-white px-1">docs/clients/GORJRM_HANDOFF.md</code>
      </p>
    </GlassPanel>
  );
}
