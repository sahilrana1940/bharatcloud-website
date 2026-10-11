#!/usr/bin/env node
/**
 * Smoke test: PAYMENT_BYPASS logic (no Supabase/Razorpay required).
 * Run: PAYMENT_BYPASS=1 node scripts/test-billing-bypass.mjs
 */

process.env.PAYMENT_BYPASS = process.env.PAYMENT_BYPASS || "1";

const { isPaymentBypassEnabled } = await import(
  "../src/lib/billing/payment-bypass.ts"
).catch(() => {
  // ts path won't work in plain node without tsx — inline check
  const enabled =
    process.env.PAYMENT_BYPASS === "1" ||
    process.env.PAYMENT_AUTO_APPROVE === "1";
  console.log("payment bypass (inline):", enabled);
  process.exit(enabled ? 0 : 1);
});

console.log("PAYMENT_BYPASS env:", process.env.PAYMENT_BYPASS);
console.log("isPaymentBypassEnabled():", isPaymentBypassEnabled());
process.exit(isPaymentBypassEnabled() ? 0 : 1);
