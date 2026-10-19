/** Paytm app deep link. Cards, netbanking, and other wallets are not offered. */
export function paytmDeepLink(amount: number, note: string): string | null {
  const vpa = process.env.NEXT_PUBLIC_PAYTM_UPI_ID?.trim();
  if (!vpa) return null;
  const payee = process.env.NEXT_PUBLIC_PAYTM_PAYEE_NAME?.trim() || "Bharat Cloud";
  const params = new URLSearchParams({
    pa: vpa,
    pn: payee,
    am: String(amount),
    cu: "INR",
    tn: note,
  });
  return `paytmmp://pay?${params.toString()}`;
}
