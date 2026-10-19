import { formatInr } from "@/lib/config/pricing.config";

/** Seat rent. First 30 days employees are 49, then 99. Admin stays 199. */
export const RENT = {
  adminMonthlyInr: 199,
  employeeFirst30DaysInr: 49,
  employeeAfter30DaysInr: 99,
  introDays: 30,
  /** Unpaid rent: pause backup. Archive storage stays intact. */
  pauseBackupAfterDays: 7,
  /** Unpaid rent: workspace becomes read-only. */
  readOnlyAfterDays: 30,
} as const;

export type RentQuote = {
  adminSeats: number;
  employeeSeats: number;
  employeeRateInr: number;
  monthlyInr: number;
  months: number;
  rentTotalInr: number;
};

export function monthlyRent(
  adminSeats: number,
  employeeSeats: number,
  employeePastIntro = false,
): number {
  const employeeRate = employeePastIntro
    ? RENT.employeeAfter30DaysInr
    : RENT.employeeFirst30DaysInr;
  return adminSeats * RENT.adminMonthlyInr + employeeSeats * employeeRate;
}

/**
 * 5 IDs on the intro window: 1 admin + 4 employees.
 * 199 + 4*49 = 395 / month. 395 * 11 = 4345.
 */
export const FIVE_ID_RENT = {
  ids: 5,
  adminSeats: 1,
  employeeSeats: 4,
  months: 11,
  planYearlyInr: 5999,
} as const;

export function fiveIdRentQuote(): RentQuote & { grandTotalInr: number } {
  const employeeRateInr = RENT.employeeFirst30DaysInr;
  const monthlyInr = monthlyRent(
    FIVE_ID_RENT.adminSeats,
    FIVE_ID_RENT.employeeSeats,
    false,
  );
  const rentTotalInr = monthlyInr * FIVE_ID_RENT.months;
  return {
    adminSeats: FIVE_ID_RENT.adminSeats,
    employeeSeats: FIVE_ID_RENT.employeeSeats,
    employeeRateInr,
    monthlyInr,
    months: FIVE_ID_RENT.months,
    rentTotalInr,
    grandTotalInr: FIVE_ID_RENT.planYearlyInr + rentTotalInr,
  };
}

export const RENT_LOCKS_SAFE =
  "Day 7 pauses backup. Storage stays safe. Day 30 switches the workspace to read-only.";

export function rentBreakdownLine(): string {
  const quote = fiveIdRentQuote();
  return `Admin ${formatInr(RENT.adminMonthlyInr)} + ${quote.employeeSeats} emp ${formatInr(quote.employeeRateInr)} = ${formatInr(quote.monthlyInr)}/mo x ${quote.months} = ${formatInr(quote.rentTotalInr)}. Plan ${formatInr(FIVE_ID_RENT.planYearlyInr)} + rent ${formatInr(quote.rentTotalInr)} = ${formatInr(quote.grandTotalInr)}.`;
}
