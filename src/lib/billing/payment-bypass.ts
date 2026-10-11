/** Temporary: skip Pro payment gate (Vercel: PAYMENT_BYPASS=1). Remove in production billing go-live. */
export function isPaymentBypassEnabled(): boolean {
  return (
    process.env.PAYMENT_BYPASS === "1" ||
    process.env.PAYMENT_AUTO_APPROVE === "1"
  );
}
