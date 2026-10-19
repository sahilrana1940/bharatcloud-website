export const RENT = {
  ADMIN: 199,
  EMP_30: 49,
  EMP_99: 99,
  PAUSE_DAYS: 7,
}

export const RENT_CONFIG = RENT

export function fiveIdRentQuote() {
  const ADMIN = 199
  const EMP = 49
  const monthly = ADMIN + 4 * EMP // 199+196=395
  const elevenMonths = monthly * 11 // 4345
  const firstYearTotal = 5999 + elevenMonths // 10344
  return {
    admin: ADMIN,
    emp: EMP,
    monthly,
    elevenMonths,
    firstYearTotal,
    breakdown: "Rs.199 + 4xRs.49 = Rs.395/mo x 11",
    adminStr: "Rs. " + ADMIN + "/mo",
    empStr: "Rs. " + EMP + "/mo",
    totalStr: "Rs. " + monthly,
  }
}

export function formatRent(n: number): string {
  if (typeof n !== "number") return "Rs. 0"
  return "Rs. " + n.toLocaleString("en-IN")
}

export const fiveIdRent = fiveIdRentQuote
export const getFiveIdRent = fiveIdRentQuote