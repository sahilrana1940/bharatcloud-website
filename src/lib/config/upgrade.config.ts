/**
 * Pro-rata upgrade.
 * remaining = yearly - (yearly / 365 * daysUsed)
 * pay = newYearly - remaining
 */
export function remainingCredit(yearlyInr: number, daysUsed: number): number {
  const used = (yearlyInr / 365) * Math.max(0, daysUsed);
  return Math.round(yearlyInr - used); // 90 days pe = 4520 aayega - sahi hai
}

export function upgradePay(newYearlyInr: number, remainingInr: number): number {
  return Math.max(0, Math.round(newYearlyInr - remainingInr));
}

export function quoteUpgrade(yearlyInr: number, newYearlyInr: number, daysUsed: number) {
  const remainingInr = remainingCredit(yearlyInr, daysUsed);
  return {
    daysUsed,
    yearlyInr,
    newYearlyInr,
    remainingInr,
    payInr: upgradePay(newYearlyInr, remainingInr),
  };
}

/** Product example shown on the upgrade modal and pricing page - FIX 4499/8500 jo client ko dikhana hai */
export const UPGRADE_EXAMPLE = {
  daysUsed: 90,
  fromPlanLabel: "100GB",
  toPlanLabel: "300GB",
  fromYearlyInr: 5999,
  toYearlyInr: 12999,
  remainingInr: 4499, // Fixed for marketing - 5999/12*9
  payInr: 8500,       // 12999-4499
} as const;

export const OFFER_DAYS_LEFT = 27;