export const RENT = {
  ADMIN: 199,
  EMP_30: 49,
  EMP_99: 99,
  PAUSE_DAYS: 7,
  // LandingView ke liye aliases
  adminMonthlyInr: 199,
  employeeFirst30DaysInr: 49,
  employeeAfter30DaysInr: 99,
  introDays: 30,
}

export const RENT_CONFIG = RENT

export function fiveIdRentQuote() {
  const ADMIN = 199
  const EMP = 49
  const monthly = ADMIN + 4 * EMP // 395
  const elevenMonths = monthly * 11 // 4345
  const grandTotal = 5999 + elevenMonths // 10344
  return {
    // Old names
    admin: ADMIN,
    emp: EMP,
    monthly,
    elevenMonths,
    firstYearTotal: grandTotal,
    // New names jo LandingView use karta hai
    adminSeats: 1,
    employeeSeats: 4,
    monthlyInr: monthly,
    months: 11,
    rentTotalInr: elevenMonths,
    grandTotalInr: grandTotal,
    adminMonthlyInr: ADMIN,
  }
}

export const fiveIdRent = fiveIdRentQuote
export const getFiveIdRent = fiveIdRentQuote