export const RENT = {
  ADMIN: 199,
  EMP_30: 49,
  EMP_99: 99,
  PAUSE_DAYS: 7,
}

export function fiveIdRentQuote() {
  const admin = RENT.ADMIN
  const emp = RENT.EMP_30
  const monthly = admin + 4 * emp
  const elevenMonths = monthly * 11
  return {
    admin: admin,
    emp: emp,
    monthly: monthly,
    elevenMonths: elevenMonths,
    totalFirstYear: 5999 + elevenMonths,
    breakdown: "Rs." + admin + " + 4xRs." + emp + " = Rs." + monthly + "/mo x11"
  }
}

export const RENT_CONFIG = RENT