import { getBillingPlan } from "@/lib/billing/plans";
import type { SupabaseClient } from "@supabase/supabase-js";

export type BillingService = "VPS" | "B3" | "Mail";

export type BillingUsageRow = {
  id: string;
  companyId: string;
  service: BillingService;
  units: number;
  amount: number;
  month: string;
  usageDate: string;
};

const DEMO_USAGE: Omit<BillingUsageRow, "id" | "companyId">[] = [
  { service: "VPS", units: 1, amount: 499, month: "", usageDate: "" },
  { service: "B3", units: 120, amount: 244, month: "", usageDate: "" },
  { service: "Mail", units: 850, amount: 100, month: "", usageDate: "" },
];

function monthStart(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

function demoRows(companyId: string): BillingUsageRow[] {
  const month = monthStart();
  const now = new Date();
  const dates = [
    new Date(now.getFullYear(), now.getMonth(), 3),
    new Date(now.getFullYear(), now.getMonth(), 8),
    new Date(now.getFullYear(), now.getMonth(), 11),
  ];
  return DEMO_USAGE.map((row, i) => ({
    id: `demo-usage-${i}`,
    companyId,
    service: row.service,
    units: row.units,
    amount: row.amount,
    month,
    usageDate: dates[i].toISOString().slice(0, 10),
  }));
}

function mapDbRow(r: Record<string, unknown>): BillingUsageRow {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    service: r.service as BillingService,
    units: Number(r.units),
    amount: Number(r.amount),
    month: String(r.month).slice(0, 10),
    usageDate: String(r.usage_date || r.month).slice(0, 10),
  };
}

export function monthlyCapInr(planId: string | undefined): number {
  const plan = getBillingPlan(planId);
  if (plan.id === "starter") return 1999;
  return plan.price;
}

export async function loadBillingUsage(
  supabase: SupabaseClient | null,
  companyId: string,
  planId?: string,
): Promise<{ rows: BillingUsageRow[]; capInr: number; month: string }> {
  const month = monthStart();
  const capInr = monthlyCapInr(planId);

  if (!supabase) {
    const rows = demoRows(companyId);
    return { rows, capInr, month };
  }

  const { data, error } = await supabase
    .from("billing_usage")
    .select("*")
    .eq("company_id", companyId)
    .eq("month", month)
    .order("usage_date", { ascending: false });

  if (error?.message?.includes("billing_usage") || !data?.length) {
    const seeded = demoRows(companyId);
    return { rows: seeded, capInr, month };
  }

  return {
    rows: data.map((r) => mapDbRow(r as Record<string, unknown>)),
    capInr,
    month,
  };
}

export function sumUsageInr(rows: BillingUsageRow[]): number {
  return rows.reduce((s, r) => s + r.amount, 0);
}
