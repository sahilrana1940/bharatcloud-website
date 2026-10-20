/**
 * Pro-rata upgrade.
 * remaining = yearly - (yearly / 365 * daysUsed)
 * pay = newYearly - remaining
 */
export function remainingCredit(yearlyInr: number, daysUsed: number): number {
  const used = (yearlyInr / 365) * Math.max(0, daysUsed);
  return Math.round(yearlyInr - used);
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

export const UPGRADE_EXAMPLE = {
  daysUsed: 90,
  fromPlanLabel: "100GB Total Storage",
  toPlanLabel: "500GB Total Storage",
  fromYearlyInr: 5999,
  toYearlyInr: 24999,
  remainingInr: 4520,
  payInr: 20479,
} as const;

export const OFFER_DAYS_LEFT = 27;
export const UPGRADE_CONFIG = { DAYS_LEFT: 27 };