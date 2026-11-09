"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { bytesLabel, rupee } from "@/lib/product/money";
import { Shell, Stat } from "@/components/product/Shell";

type Employee = { id: string; name: string; email: string; storage_gb: number };
type Overview = {
  user: { role: string; name: string };
  company: {
    name: string;
    planLabel: string;
    cycle: string;
    yearlyPaise: number;
    monthlyPaise: number;
    allocatedIds: number;
    allocatedGb: number;
    usedIds: number;
    usedGb: number;
    paymentStatus: string;
    access: string;
    demoEnds: string;
  };
  employees: Employee[];
  usage: { usedBytes: number; limitBytes: number; limitGb: number };
  notifications: { id: string; message: string; created_at: string }[];
  upi: string;
};

export function CompanyHome({ mode }: { mode: "company" | "employee" }) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    const response = await fetch("/api/product/company");
    const body = await response.json();
    if (!response.ok) setError(body.error || "Dashboard nahi khula.");
    else setData(body);
  }

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);

  async function createEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/product/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        storageGb: Number(form.get("storageGb")),
      }),
    });
    const body = await response.json();
    setNote(response.ok ? "Employee ban gaya." : body.error);
    if (response.ok) {
      event.currentTarget.reset();
      await load();
    }
  }

  async function pay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/product/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pay", upiRef: form.get("upiRef"), cycle: form.get("cycle") }),
    });
    const body = await response.json();
    setNote(response.ok ? "Payment Super Admin ke paas hai." : body.error);
    if (response.ok) await load();
  }

  const title = mode === "company" ? "Company Admin" : "Employee";
  return (
    <Shell title={data ? data.company.name : title} role={title}>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {note ? <p className="mb-3 text-sm text-[#0f6b4c]">{note}</p> : null}
      {data ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Aapka Plan" value={data.company.planLabel} />
            <Stat label="ID used / total" value={`${data.company.usedIds} / ${data.company.allocatedIds}`} />
            <Stat label="Storage aapka" value={`${bytesLabel(data.usage.usedBytes)} / ${data.usage.limitGb} GB`} />
          </div>
          <p className="text-sm">
            Access: {data.company.access}. {data.company.access === "demo" ? `Demo ${new Date(data.company.demoEnds).toLocaleDateString("en-IN")} tak.` : null}
            {data.company.access === "locked" ? " 7 din khatam. Pay karke continue karo." : null}
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <Link href="/hub/drive" className="rounded-3xl bg-white p-5 font-semibold">Bharat Tijori Drive - Open Karo</Link>
            <Link href="/hub/backup" className="rounded-3xl bg-white p-5 font-semibold">Email Backup - Open Karo</Link>
            <Link href="/hub/drive?filter=shared" className="rounded-3xl bg-white p-5 font-semibold">Shared With Me</Link>
          </div>
          {data.notifications.length ? (
            <section className="rounded-3xl bg-white p-4 text-sm">
              {data.notifications.map((note) => <p key={note.id}>{note.message}</p>)}
            </section>
          ) : null}
          {mode === "company" ? (
            <>
              <section className="rounded-3xl bg-white p-5">
                <h2 className="font-semibold">Employee banao</h2>
                <p className="text-sm">Bacha ID {data.company.allocatedIds - data.company.usedIds}. Assigned storage {data.company.usedGb} / {data.company.allocatedGb} GB.</p>
                <form onSubmit={createEmployee} className="mt-3 grid gap-2 md:grid-cols-4">
                  <input name="name" required placeholder="Naam" className="rounded-xl border px-3 py-2 text-sm" />
                  <input name="email" type="email" required placeholder="Email" className="rounded-xl border px-3 py-2 text-sm" />
                  <input name="password" type="password" required placeholder="Password" className="rounded-xl border px-3 py-2 text-sm" />
                  <input name="storageGb" type="number" min="1" required placeholder="GB" className="rounded-xl border px-3 py-2 text-sm" />
                  <button className="rounded-full bg-[#c65d12] px-4 py-2 text-sm font-semibold text-white">Employee banao</button>
                </form>
                <ul className="mt-4 space-y-1 text-sm">
                  {data.employees.map((employee) => (
                    <li key={employee.id}>{employee.name} · {employee.email} · {employee.storage_gb} GB</li>
                  ))}
                </ul>
              </section>
              <section className="rounded-3xl bg-white p-5">
                <h2 className="font-semibold">Plan pay karo</h2>
                <p className="text-sm">UPI {data.upi || "set nahi"} · Yearly {rupee(data.company.yearlyPaise)} · Monthly {rupee(data.company.monthlyPaise)}</p>
                <form onSubmit={pay} className="mt-3 flex flex-wrap gap-2">
                  <select name="cycle" className="rounded-xl border px-3 py-2 text-sm">
                    {data.company.cycle !== "monthly" ? <option value="yearly">Yearly</option> : null}
                    {data.company.cycle !== "yearly" ? <option value="monthly">Monthly</option> : null}
                  </select>
                  <input name="upiRef" required placeholder="UPI reference" className="rounded-xl border px-3 py-2 text-sm" />
                  <button className="rounded-full bg-[#1c1915] px-4 py-2 text-sm font-semibold text-white">Payment bheja</button>
                </form>
              </section>
            </>
          ) : null}
        </div>
      ) : null}
    </Shell>
  );
}
