"use client";

import { useEffect, useState } from "react";

import { rupee } from "@/lib/product/money";
import { Shell, Stat } from "@/components/product/Shell";

type Company = {
  id: string;
  name: string;
  cycle: "monthly" | "yearly" | "both";
  yearly_paise: number;
  monthly_paise: number;
  allocated_ids: number;
  allocated_gb: number;
  planLabel: string;
  profitPaise: number;
  payment_status: string;
};

type ProductCard = {
  code: string;
  name: string;
  ids: number;
  gb: number;
  priceLabel: string;
  owned: boolean;
};

type Overview = {
  plan: {
    code: string;
    name: string;
    paymentStatus: string;
    totalIds: number;
    totalGb: number;
    usedIds: number;
    usedGb: number;
    leftIds: number;
    leftGb: number;
    priceLabel: string;
  };
  products: ProductCard[];
  companies: Company[];
  earningPaise: number;
  pendingCommissionPaise: number;
  upi: string;
};

export function PartnerHome() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editError, setEditError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function load() {
    const response = await fetch("/api/product/partner");
    const body = await response.json();
    if (!response.ok) setError(body.error || "Dashboard nahi khula.");
    else setData(body);
  }

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);

  async function pay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/product/partner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pay", upiRef: form.get("upiRef") }),
    });
    const body = await response.json();
    setNote(response.ok ? "Payment Super Admin ke paas confirm ke liye gayi." : body.error);
    if (response.ok) await load();
  }

  async function createCompany(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      companyName: String(form.get("companyName") || ""),
      adminName: String(form.get("adminName") || ""),
      adminEmail: String(form.get("adminEmail") || ""),
      adminPassword: String(form.get("adminPassword") || ""),
      cycle: String(form.get("cycle") || "yearly"),
      yearlyRupees: form.get("yearlyRupees") === "" || form.get("yearlyRupees") == null ? "" : Number(form.get("yearlyRupees")),
      monthlyRupees: form.get("monthlyRupees") === "" || form.get("monthlyRupees") == null ? "" : Number(form.get("monthlyRupees")),
      ids: form.get("ids") === "" || form.get("ids") == null ? "" : Number(form.get("ids")),
      storageGb: form.get("storageGb") === "" || form.get("storageGb") == null ? "" : Number(form.get("storageGb")),
    };
    console.log("Company banao payload", {
      ...payload,
      adminPassword: payload.adminPassword ? `${payload.adminPassword.length} characters` : "(missing)",
    });
    setFormError("");
    setNote("");
    const response = await fetch("/api/product/partner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({ error: "Server ne jawab nahi diya." }));
    if (!response.ok) {
      const message = body.error || `Request fail. Status ${response.status}.`;
      console.error("Company banao fail", response.status, message);
      setFormError(message);
      if (body.plan) {
        setData((current) => (current ? { ...current, plan: body.plan } : current));
      }
      await load();
      return;
    }
    console.log("Company banao ok", body);
    setNote("Company ban gayi.");
    event.currentTarget.reset();
    await load();
  }

  async function updatePrice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/product/partner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "price",
        companyId: form.get("companyId"),
        cycle: form.get("cycle"),
        yearlyRupees: Number(form.get("yearlyRupees") || 0),
        monthlyRupees: Number(form.get("monthlyRupees") || 0),
        ids: Number(form.get("ids")),
        storageGb: Number(form.get("storageGb")),
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setEditError(body.error || "Update nahi hua.");
      return;
    }
    setEditError("");
    setEditingId(null);
    setNote("Company update ho gayi.");
    await load();
  }

  return (
    <Shell title="Partner Dashboard" role="Partner">
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {note ? <p className="mb-4 text-sm text-[#0f6b4c]">{note}</p> : null}
      {data ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Mera Plan" value={`${data.plan.name} · ${data.plan.priceLabel} · ${data.plan.paymentStatus === "paid" ? "Paid" : data.plan.paymentStatus === "pending" ? "Pending" : "Unpaid"}`} />
            <Stat label="Total / Used / Bacha ID" value={`${data.plan.totalIds} / ${data.plan.usedIds} / ${data.plan.leftIds}`} />
            <Stat label="Total / Used / Bacha GB" value={`${data.plan.totalGb} / ${data.plan.usedGb} / ${data.plan.leftGb}`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Meri Earning" value={rupee(data.earningPaise)} />
            <Stat label="Pending Commission" value={rupee(data.pendingCommissionPaise)} />
          </div>
          {data.plan.paymentStatus === "paid" ? (
            <section className="rounded-3xl bg-white p-5">
              <h2 className="font-semibold">Starter plan</h2>
              <p className="mt-1 text-sm">Paid · 5 ID · 100 GB</p>
            </section>
          ) : (
            <section className="rounded-3xl bg-white p-5">
              <h2 className="font-semibold">Starter kharido</h2>
              <p className="mt-1 text-sm">UPI: {data.upi || "Super Admin UPI set nahi hai"} · ₹6,999</p>
              <form onSubmit={pay} className="mt-3 flex flex-wrap gap-2">
                <input name="upiRef" required placeholder="UPI reference" className="rounded-xl border px-3 py-2 text-sm" />
                <button className="rounded-full bg-[#1c1915] px-4 py-2 text-sm font-semibold text-white">Payment bheja</button>
              </form>
            </section>
          )}
          <section className="rounded-3xl bg-white p-5">
            <h2 className="font-semibold">Company banao</h2>
            <p className="mt-1 text-sm">
              Bacha hua: {data.plan.leftIds} ID / {data.plan.leftGb} GB. Total {data.plan.totalIds} ID / {data.plan.totalGb} GB, used {data.plan.usedIds} ID / {data.plan.usedGb} GB.
            </p>
            <form noValidate onSubmit={createCompany} className="mt-3 grid gap-2 md:grid-cols-2">
              <input name="companyName" required placeholder="Company, jaise Jyoti Footwear" className="rounded-xl border px-3 py-2 text-sm" />
              <input name="adminName" required placeholder="Admin naam" className="rounded-xl border px-3 py-2 text-sm" />
              <input name="adminEmail" type="email" required placeholder="Admin email" className="rounded-xl border px-3 py-2 text-sm" />
              <input name="adminPassword" type="password" required placeholder="Admin password" className="rounded-xl border px-3 py-2 text-sm" />
              <select name="cycle" className="rounded-xl border px-3 py-2 text-sm">
                <option value="yearly">Yearly</option>
                <option value="monthly">Monthly</option>
                <option value="both">Monthly aur Yearly</option>
              </select>
              <input name="yearlyRupees" type="number" min="1" placeholder="Yearly price, jaise 8999" className="rounded-xl border px-3 py-2 text-sm" />
              <input name="monthlyRupees" type="number" min="0" placeholder="Monthly price, khali chhodo to yearly/10" className="rounded-xl border px-3 py-2 text-sm" />
              <input name="ids" type="number" required placeholder="ID do" className="rounded-xl border px-3 py-2 text-sm" />
              <input name="storageGb" type="number" required placeholder="GB do" className="rounded-xl border px-3 py-2 text-sm" />
              <button type="submit" className="rounded-full bg-[#c65d12] px-4 py-2 text-sm font-semibold text-white">Company banao</button>
            </form>
            {formError ? <p className="mt-3 text-sm font-semibold text-red-700">{formError}</p> : null}
          </section>
          <section className="space-y-3">
            <h2 className="font-semibold">Products</h2>
            <ProductList products={data.products || []} />
          </section>
          <section className="space-y-3">
            <h2 className="font-semibold">Meri Companies</h2>
            {data.companies.length === 0 ? <p className="text-sm">Abhi koi company nahi hai.</p> : null}
            {data.companies.map((company) => (
              <article key={company.id} className="rounded-3xl bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{company.name}</p>
                    <p className="text-sm">Aapka set price: {company.planLabel} · Profit {rupee(company.profitPaise)} · Payment {company.payment_status}</p>
                    <p className="text-sm">ID {company.allocated_ids} · {company.allocated_gb} GB</p>
                  </div>
                  {editingId !== company.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(company.id);
                        setEditError("");
                      }}
                      className="rounded-full border px-4 py-2 text-sm font-semibold"
                    >
                      Edit
                    </button>
                  ) : null}
                </div>
                {editingId === company.id ? (
                  <form onSubmit={updatePrice} className="mt-3 grid gap-2 md:grid-cols-3">
                    <input type="hidden" name="companyId" value={company.id} />
                    <select name="cycle" defaultValue={company.cycle} className="rounded-xl border px-3 py-2 text-sm">
                      <option value="yearly">Yearly</option>
                      <option value="monthly">Monthly</option>
                      <option value="both">Dono</option>
                    </select>
                    <input name="yearlyRupees" type="number" defaultValue={company.yearly_paise / 100} className="rounded-xl border px-3 py-2 text-sm" />
                    <input name="monthlyRupees" type="number" defaultValue={company.monthly_paise / 100} className="rounded-xl border px-3 py-2 text-sm" />
                    <input name="ids" type="number" defaultValue={company.allocated_ids} className="rounded-xl border px-3 py-2 text-sm" />
                    <input name="storageGb" type="number" defaultValue={company.allocated_gb} className="rounded-xl border px-3 py-2 text-sm" />
                    <div className="flex flex-wrap gap-2 md:col-span-3">
                      <button type="submit" className="rounded-full bg-[#1c1915] px-4 py-2 text-sm font-semibold text-white">Save</button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditError("");
                        }}
                        className="rounded-full border px-4 py-2 text-sm font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                    {editError ? <p className="text-sm font-semibold text-red-700 md:col-span-3">{editError}</p> : null}
                  </form>
                ) : null}
              </article>
            ))}
          </section>
        </div>
      ) : null}
    </Shell>
  );
}

export function ProductList({ products }: { products: ProductCard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {products.map((product) =>
        product.owned ? (
          <article key={product.code} className="rounded-3xl bg-white p-5">
            <p className="text-xs font-semibold text-[#0f6b4c]">Open</p>
            <h3 className="mt-1 text-xl font-bold">{product.name}</h3>
            <p className="mt-2 text-sm">{product.ids} ID · {product.gb} GB</p>
            <p className="text-sm">{product.priceLabel}</p>
          </article>
        ) : (
          <article key={product.code} className="rounded-3xl border border-dashed border-[#d9d0c3] bg-[#efeae2] p-5 text-[#8a8175]">
            <p className="text-xs font-semibold">Lock</p>
            <h3 className="mt-1 text-xl font-bold">{product.name}</h3>
            <p className="mt-2 text-sm font-semibold">Buy Plan</p>
          </article>
        ),
      )}
    </div>
  );
}
