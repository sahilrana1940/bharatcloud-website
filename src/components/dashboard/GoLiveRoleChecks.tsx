"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

import { GlassPanel } from "@/components/ui/pro/primitives";

type UserRow = { email: string; role: string; name?: string };

type CheckRow = {
  email: string;
  login: boolean;
  drive: boolean;
  backup: boolean;
};

const STEPS: { key: keyof Pick<CheckRow, "login" | "drive" | "backup">; label: string }[] = [
  { key: "login", label: "Login at bharatcloud.store/login" },
  { key: "drive", label: "Settings → Google Drive connected" },
  { key: "backup", label: "Drive backup or vault upload completed" },
];

const PENDING_HINT =
  "Team page par invite bhejein, phir is account se login test karein.";

export function GoLiveRoleChecks({
  companyId,
  adminEmail,
  plannedStaffEmails = [],
}: {
  companyId: string;
  adminEmail: string;
  plannedStaffEmails?: string[];
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [checks, setChecks] = useState<CheckRow[]>([]);

  useEffect(() => {
    fetch("/api/team/users")
      .then((r) => r.json())
      .then((j) => setUsers(j.users || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/go-live-checks?company_id=${encodeURIComponent(companyId)}`)
      .then((r) => r.json())
      .then((j) => setChecks(j.checks || []))
      .catch(() => setChecks([]));
  }, [companyId]);

  const checkByEmail = useMemo(() => {
    const m = new Map<string, CheckRow>();
    for (const c of checks) m.set(c.email.toLowerCase(), c);
    return m;
  }, [checks]);

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
    const fromDb = realEmployees[i];
    if (fromDb) {
      employees.push(fromDb);
      continue;
    }
    const planned = plannedStaffEmails[i]?.trim();
    if (planned) {
      employees.push({
        email: planned,
        role: "member",
        name: "Planned — invite on Team if missing",
      });
      continue;
    }
    employees.push({
      email: `Staff slot ${i + 1} — invite on Team`,
      role: "member",
      name: "Pending invite",
    });
  }

  function RoleBlock({ title, u }: { title: string; u: UserRow }) {
    const placeholder = u.email.startsWith("Staff slot");
    const plannedOnly = u.name === "Planned — invite on Team if missing";
    const c = checkByEmail.get(u.email.toLowerCase());

    return (
      <li className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{title}</p>
        <p
          className={`mt-1 font-medium ${
            placeholder ? "text-slate-400" : plannedOnly ? "text-slate-800" : "text-slate-900"
          }`}
        >
          {u.email}
        </p>
        {(plannedOnly || placeholder) && (
          <p className="mt-1 text-xs text-amber-700">{PENDING_HINT}</p>
        )}
        <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
          {STEPS.map((step) => {
            const ok = c?.[step.key] === true;
            return (
              <li key={step.key} className="flex items-start gap-2">
                {ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                )}
                <span className={ok ? "text-slate-800" : "text-slate-500"}>
                  {step.label}
                  {!ok && !placeholder && (
                    <span className="mt-0.5 block text-xs text-amber-700">{PENDING_HINT}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </li>
    );
  }

  return (
    <GlassPanel className="mt-8 p-6">
      <h2 className="text-lg font-semibold text-slate-900">Go-live checks (owner + 3 employees)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Har account par login, Drive connect, aur backup/vault — green tick jab complete ho.
      </p>
      <ul className="mt-6 space-y-4">
        <RoleBlock title="Owner / admin" u={owner} />
        {employees.map((u, i) => (
          <RoleBlock key={`emp-${i}`} title={`Employee ${i + 1}`} u={u} />
        ))}
      </ul>
    </GlassPanel>
  );
}
