"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { postFix, useIstClock } from "@/components/super-admin/AdminShell";

const SUPER_ADMIN_EMAIL = "support@bharatcloud.store";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  lastAction: string;
  status: string;
};

type LogRow = {
  id: string;
  timestamp: string;
  emp?: string;
  action: string;
  details: string;
  status: string;
};

const NAV = [
  { href: "/super-admin", label: "Overview" },
  { href: "/super-admin/users", label: "Tenants" },
  { href: "/super-admin/infrastructure", label: "Infrastructure" },
  { href: "/super-admin/billing", label: "Billing" },
  { href: "/super-admin/users", label: "Users" },
  { href: "/super-admin/high-command", label: "Admin Employees" },
  { href: "/super-admin/high-command#security", label: "Security" },
  { href: "/super-admin/logs", label: "Recollect Logs" },
];

const ACTIONS = [
  { label: "RUN DIAGNOSTICS", type: "LOGS" },
  { label: "PATCH MODULES", type: "INFRA" },
  { label: "CLEAR CACHE", type: "CACHE" },
  { label: "RESTART SERVICE", type: "STORAGE" },
];

const headers = {
  "Content-Type": "application/json",
  "x-admin-email": SUPER_ADMIN_EMAIL,
};

export default function HighCommandPage() {
  const time = useIstClock();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Employee");

  function load() {
    Promise.all([
      fetch("/api/super-admin/employees", { cache: "no-store" }),
      fetch("/api/super-admin/logs", { cache: "no-store" }),
    ])
      .then(async ([empRes, logRes]) => {
        if (empRes.status === 403 || logRes.status === 403) throw new Error("403 Forbidden");
        setEmployees(await empRes.json());
        setLogs(await logRes.json());
      })
      .catch((err: Error) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function undo(actionId: string) {
    const res = await fetch("/api/super-admin/recollect", {
      method: "POST",
      cache: "no-store",
      headers,
      body: JSON.stringify({ actionId }),
    });
    const data = await res.json();
    setNote(res.status === 403 ? "403 Forbidden" : String(data.message || ""));
    load();
  }

  async function addEmployee() {
    const res = await fetch("/api/super-admin/employees", {
      method: "POST",
      cache: "no-store",
      headers,
      body: JSON.stringify({ name, email, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNote(res.status === 403 ? "403 Forbidden" : String(data.error || "Add failed"));
      return;
    }
    setName("");
    setEmail("");
    setNote(`Added ${data.email}`);
    load();
  }

  async function deleteEmployee(row: Employee) {
    const res = await fetch("/api/super-admin/employees", {
      method: "DELETE",
      cache: "no-store",
      headers,
      body: JSON.stringify({ id: row.id, email: row.email }),
    });
    const data = await res.json();
    setNote(res.ok ? `Deleted ${row.email}` : res.status === 403 ? "403 Forbidden" : String(data.error || "Delete failed"));
    if (res.ok) load();
  }

  const history = logs.slice(0, 2);
  const employeeCount = employees.filter((row) => row.role === "EMPLOYEE").length;

  return (
    <div className="min-h-screen bg-[#0b1020] font-mono text-amber-50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 bg-[#111827] px-6 py-4">
        <div>
          <p className="text-sm font-bold tracking-[0.18em] text-amber-400">HIGH COMMAND CENTER</p>
          <p className="text-xs text-sky-300">MUMBAI DC-01 • LIVE</p>
        </div>
        <p className="text-xs tracking-widest text-amber-200">CLASSIFICATION RESTRICTED</p>
        <p className="text-xs text-sky-200">IST {time}</p>
        <span className="rounded border border-amber-400 bg-amber-500 px-3 py-1.5 text-[11px] font-bold tracking-wide text-slate-950">
          support@bharatcloud.store = SUPERADMIN
        </span>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="rounded border border-rose-400 px-3 py-1 text-[10px] font-bold tracking-widest text-rose-300 hover:bg-rose-500 hover:text-white">
            LOG OUT
          </button>
        </form>
      </header>
      <div className="flex min-h-[calc(100vh-120px)]">
        <aside className="flex w-56 shrink-0 flex-col border-r border-sky-500/20 bg-[#0f172a] p-4">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`mb-1 rounded px-3 py-2 text-xs tracking-wide ${
                item.label === "Admin Employees"
                  ? "bg-amber-500 text-slate-950"
                  : "text-sky-200 hover:bg-sky-500/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-auto border border-sky-500/40 p-3 text-[10px] leading-relaxed text-sky-300">
            SERVER STATUS
            <br />
            SECURE ENCRYPTED
            <br />
            NODE MUMBAI-DC-01
            <br />
            ONLINE
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-6">
          <h1 className="text-xl font-bold tracking-wide text-amber-400">Admin Employee Management</h1>
          <p className="mt-2 text-sm font-bold tracking-wide text-amber-300">support@bharatcloud.store = SUPERADMIN</p>
          {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
          {note ? <p className="mt-3 text-sm text-amber-300">{note}</p> : null}

          <form
            className="mt-6 grid gap-3 rounded-xl border border-amber-500/40 bg-[#111827] p-4 md:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              addEmployee();
            }}
          >
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
              className="rounded-lg border border-sky-500/30 bg-[#0b1020] px-3 py-2 text-sm text-white outline-none"
            />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Work email"
              type="email"
              required
              className="rounded-lg border border-sky-500/30 bg-[#0b1020] px-3 py-2 text-sm text-white outline-none"
            />
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="rounded-lg border border-sky-500/30 bg-[#0b1020] px-3 py-2 text-sm text-white outline-none"
            >
              <option>Employee</option>
              <option>Admin</option>
            </select>
            <button type="submit" className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950">
              Add employee
            </button>
          </form>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-amber-500/40 bg-[#111827] p-4">
              <p className="text-[10px] tracking-widest text-amber-200/70">Active Admins</p>
              <p className="mt-2 text-4xl font-bold text-amber-400">{Math.max(employees.length - employeeCount, 0)}</p>
              <p className="text-xs text-sky-200">Online</p>
            </article>
            <article className="rounded-xl border border-sky-500/30 bg-[#111827] p-4">
              <p className="text-[10px] tracking-widest text-sky-300/70">Employees</p>
              <p className="mt-2 text-4xl font-bold text-sky-300">{employeeCount}</p>
              <p className="text-xs text-sky-200">Real records</p>
            </article>
            <article className="rounded-xl border border-sky-500/30 bg-[#111827] p-4">
              <p className="text-[10px] tracking-widest text-sky-300/70">Recollect Actions</p>
              <p className="mt-2 text-4xl font-bold text-white">0</p>
              <p className="text-xs text-sky-200">No actions pending</p>
            </article>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-amber-500/30">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111827] text-[10px] tracking-widest text-amber-300">
                <tr>
                  <th className="px-3 py-2">EMP ID</th>
                  <th className="px-3 py-2">NAME</th>
                  <th className="px-3 py-2">EMAIL</th>
                  <th className="px-3 py-2">ROLE</th>
                  <th className="px-3 py-2">LAST ACTION</th>
                  <th className="px-3 py-2">STATUS</th>
                  <th className="px-3 py-2">DELETE</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((row) => (
                  <tr key={row.id} className="border-t border-sky-500/20">
                    <td className="px-3 py-3">{row.id}</td>
                    <td className="px-3 py-3">{row.email.toLowerCase() === SUPER_ADMIN_EMAIL ? "support@bharatcloud.store" : row.name}</td>
                    <td className="px-3 py-3">{row.email}</td>
                    <td className="px-3 py-3">
                      {row.email.toLowerCase() === SUPER_ADMIN_EMAIL ? (
                        <span className="rounded bg-amber-500 px-2 py-1 font-bold text-slate-950">SUPERADMIN</span>
                      ) : (
                        <span className="text-sky-300">{row.role}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">{row.lastAction}</td>
                    <td className="px-3 py-3 text-amber-400">{row.status}</td>
                    <td className="px-3 py-3">
                      {row.email.toLowerCase() === SUPER_ADMIN_EMAIL ? (
                        <span className="text-zinc-500">Locked</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => deleteEmployee(row)}
                          className="rounded border border-rose-400 px-2 py-1 text-[10px] text-rose-300"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
        <aside id="security" className="hidden w-80 shrink-0 border-l border-sky-500/20 bg-[#0f172a] p-4 xl:block">
          <p className="text-xs tracking-widest text-amber-300">Recollect System</p>
          <p className="mt-2 text-sm text-sky-200">IDLE NO ACTIONS</p>
          <p className="mt-6 text-[10px] tracking-widest text-amber-300">ACTION HISTORY</p>
          <ul className="mt-3 space-y-3">
            {history.map((row) => (
              <li key={row.id} className="border border-sky-500/30 p-3 text-[11px]">
                <p className="text-amber-300">{row.action}</p>
                <p>{row.details}</p>
                <p className="text-zinc-500">{row.timestamp} IST</p>
                <button
                  type="button"
                  onClick={() => undo(row.id)}
                  className="mt-2 border border-amber-400 px-2 py-1 text-[10px] text-amber-300"
                >
                  Undo
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-2">
            {ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={async () => setNote(await postFix(action.type))}
                className="border border-sky-400 px-3 py-2 text-[10px] tracking-widest text-sky-200 hover:bg-sky-500 hover:text-slate-950"
              >
                {action.label}
              </button>
            ))}
          </div>
        </aside>
      </div>
      <footer className="grid gap-2 border-t border-amber-500/30 bg-[#111827] px-6 py-3 text-[10px] tracking-widest text-sky-200 md:grid-cols-4">
        <p>SYSTEM HEALTH ALL OPERATIONAL</p>
        <p>E2E LIVE CONNECTED</p>
        <p>LOGS 0 KB STORAGE OK</p>
        <p>SECURITY ACTIVE FIREWALL ENABLED</p>
      </footer>
    </div>
  );
}
