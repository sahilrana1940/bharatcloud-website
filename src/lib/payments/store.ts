export type PaymentRow = {
  id: string;
  company_domain: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const demoPayments: PaymentRow[] = [];

export function demoPaymentsList() {
  return [...demoPayments];
}

export function demoPaymentInsert(domain: string, amount: number) {
  const row: PaymentRow = {
    id: `pay-${Date.now()}`,
    company_domain: domain,
    amount,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  demoPayments.unshift(row);
  return row;
}

export function demoPaymentApprove(id: string) {
  const p = demoPayments.find((x) => x.id === id);
  if (p) p.status = "approved";
  return p;
}
