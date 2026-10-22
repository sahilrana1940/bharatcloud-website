/** Live collect VPA. Env wins; this fallback is used when the host has not set it. */
export const BILLING_UPI_VPA_FALLBACK = "9469276461@idfcfirst";
export const BILLING_UPI_NAME_FALLBACK = "Bharat Tijori";
/** Alternate pay path shown next to the QR. */
export const BILLING_UPI_NUMBER = "77199526";

function firstSet(...values: Array<string | undefined>) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

export function envFlagOn(value: string | undefined) {
  const flag = value?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

export function billingUpiVpa() {
  return (
    firstSet(
      process.env.NEXT_PUBLIC_BILLING_UPI_VPA,
      process.env.BILLING_UPI_VPA,
      process.env.NEXT_PUBLIC_UPI_ID,
      process.env.NEXT_PUBLIC_PAYTM_UPI_ID,
    ) || BILLING_UPI_VPA_FALLBACK
  );
}

export function billingUpiName() {
  return (
    firstSet(
      process.env.NEXT_PUBLIC_BILLING_UPI_NAME,
      process.env.BILLING_UPI_NAME,
      process.env.NEXT_PUBLIC_UPI_PAYEE_NAME,
      process.env.NEXT_PUBLIC_PAYTM_PAYEE_NAME,
    ) || BILLING_UPI_NAME_FALLBACK
  );
}

export function billingUpiNote(planName: string, amount: number) {
  if (amount === 24999) return "BharatCloud Pro";
  return `BharatCloud ${planName}`;
}

/** upi://pay?pa=9469276461@idfcfirst&pn=Bharat%20Tijori&am=24999&cu=INR&tn=BharatCloud%20Pro */
export function buildUpiPayLink(amount: number, note: string) {
  const pa = billingUpiVpa();
  const pn = encodeURIComponent(billingUpiName());
  const tn = encodeURIComponent(note);
  return `upi://pay?pa=${pa}&pn=${pn}&am=${amount}&cu=INR&tn=${tn}`;
}
