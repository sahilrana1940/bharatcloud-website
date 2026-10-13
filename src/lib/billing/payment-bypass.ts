import { cookies } from "next/headers";

/** Cookie toggled by super admin POST /api/billing/status (runtime test mode). */
export const PAYMENT_BYPASS_COOKIE = "bc_payment_bypass";

function envBypassEnabled(): boolean {
  return (
    process.env.PAYMENT_BYPASS === "1" ||
    // Common Vercel typo (PAMENT_BYPASS)
    process.env.PAMENT_BYPASS === "1" ||
    process.env.PAYMENT_AUTO_APPROVE === "1"
  );
}

/** 0 = prod gate, 1 = test bypass (env or cookie). */
export async function readPaymentBypassFlag(): Promise<0 | 1> {
  if (envBypassEnabled()) return 1;
  try {
    const jar = await cookies();
    if (jar.get(PAYMENT_BYPASS_COOKIE)?.value === "1") return 1;
  } catch {
    /* outside request context */
  }
  return 0;
}

export async function isPaymentBypassEnabled(): Promise<boolean> {
  return (await readPaymentBypassFlag()) === 1;
}
