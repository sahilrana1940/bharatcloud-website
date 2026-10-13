import type { BillingUsageRow } from "@/lib/billing/usage";

export type BillingInvoice = {
  invoiceNumber: string;
  companyId: string;
  companyDomain?: string;
  month: string;
  currency: "INR";
  gstRate: number;
  lineItems: {
    date: string;
    service: string;
    units: number;
    amountInr: number;
  }[];
  subtotalInr: number;
  gstInr: number;
  totalInr: number;
  note: string;
};

/** Split GST-inclusive total into pre-tax + 18% GST (India). */
export function splitGstInclusive(totalInr: number, rate = 0.18): {
  subtotalInr: number;
  gstInr: number;
} {
  const subtotalInr = Math.round(totalInr / (1 + rate));
  const gstInr = totalInr - subtotalInr;
  return { subtotalInr, gstInr };
}

export function buildInvoiceFromUsage(
  companyId: string,
  month: string,
  rows: BillingUsageRow[],
  companyDomain?: string,
): BillingInvoice {
  const totalInr = rows.reduce((s, r) => s + r.amount, 0);
  const { subtotalInr, gstInr } = splitGstInclusive(totalInr);
  const ym = month.slice(0, 7).replace("-", "");
  return {
    invoiceNumber: `BC-${ym}-${companyId.slice(0, 8).toUpperCase()}`,
    companyId,
    companyDomain,
    month,
    currency: "INR",
    gstRate: 0.18,
    lineItems: rows.map((r) => ({
      date: r.usageDate,
      service: r.service,
      units: r.units,
      amountInr: r.amount,
    })),
    subtotalInr,
    gstInr,
    totalInr,
    note: "Amounts are GST inclusive (18% IGST shown for records).",
  };
}
