import { NextResponse } from "next/server";

import { denyUnlessSuperAdmin } from "@/lib/super-admin/guard";
import { BANK_UPI_METHOD, RAZORPAY_METHOD, paymentMethodLabel } from "@/lib/super-admin/locked-spec";
import { getSupabaseOrNull } from "@/lib/workspace/db";

function gbOf(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = Number(row[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

function formatStorage(gb: number) {
  if (gb >= 1024) return `${(gb / 1024).toFixed(2)}TB`;
  return `${gb.toFixed(2)}GB`;
}

export async function GET() {
  const auth = await denyUnlessSuperAdmin();
  if (auth.response) return auth.response;

  const supabase = await getSupabaseOrNull();
  let usedGb = 0;
  let totalGb = 0;
  let transactions: Array<Record<string, string | number>> = [];
  let upiReceived = 0;
  let razorpayReceived = 0;

  if (supabase) {
    const companies = await supabase.from("companies").select("*").limit(500);
    for (const row of companies.data || []) {
      const record = row as Record<string, unknown>;
      usedGb += gbOf(record, ["storage_used_gb", "storage_used", "used_gb"]);
      totalGb += gbOf(record, ["storage_limit_gb", "storage_limit"]);
    }

    const payments = await supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(50);
    transactions = (payments.data || []).map((row) => {
      const record = row as Record<string, unknown>;
      const method = paymentMethodLabel(String(record.method || record.provider || record.gateway || ""));
      const amount = Number(record.amount || record.amount_inr || 0);
      const status = String(record.status || "pending");
      if (status === "verified" || status === "active" || status === "paid") {
        if (method === RAZORPAY_METHOD) razorpayReceived += amount;
        else upiReceived += amount;
      }
      return {
        id: String(record.id || ""),
        date: String(record.created_at || record.date || ""),
        company: String(record.company || record.company_domain || record.company_id || ""),
        plan: String(record.plan || record.plan_name || ""),
        amount,
        method,
        status,
      };
    });
  }

  const monthlyBill = 0;
  const monthlyReceived = upiReceived + razorpayReceived;

  return NextResponse.json({
    supabase: { used: formatStorage(usedGb), total: formatStorage(totalGb), usedGb, totalGb },
    firebase: { requests: 0, limit: 0, label: "0 / Free tier" },
    monthlyBill,
    monthlyBillLabel: "$0",
    monthlyReceived,
    upiReceived,
    razorpayReceived,
    netProfit: monthlyReceived - monthlyBill,
    methods: { upi: BANK_UPI_METHOD, razorpay: RAZORPAY_METHOD },
    transactions,
  });
}
