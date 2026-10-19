// src/lib/config/rent.config.ts - 2026 - FINAL COMPAT - MADE IN INDIA
// Old imports ko break nahi hone dega - Live safe

export const RENT_LOCKS_SAFE = {
  day0_7: "Backup pause - data safe, sync stopped - no delete",
  day7_30: "Read-only - mail view only - no send",
  day30_90: "Admin purge only after 90 days notice - Mumbai E2E",
  title: "Backup Safety Locks - 2026",
} as const;

// Alias plus the seat rates older modules still read.
export const RENT = {
  ...RENT_LOCKS_SAFE,
  adminMonthlyInr: 199,
  employeeFirst30DaysInr: 49,
  employeeAfter30DaysInr: 99,
};

// Functions jo DashboardConsole expect kar raha hai
export function fiveIdRentQuote() {
  return {
    title: "Fixed ID Pricing - 2026",
    message: "No rent breakdown - Yearly pricing only - Paytm Only",
    yearly: "₹5,999 / ₹12,999 / ₹14,999",
    hosting: "Hostinger + Mumbai E2E",
    monthlyInr: 395,
  };
}

export function forwardPendingInr(count: number = 0) {
  // No forward charge now - Fixed ID
  return 0;
}

export const GODADDY_SCAN = {
  enabled: false,
  message: "GoDaddy scan blocked - Mumbai E2E only",
  blocked: true,
};

export const OFFER_DAYS_LEFT = 7;

// Extra exports jo kahi aur use ho sakte hain
export const RENT_LOCKS = RENT_LOCKS_SAFE;
export const SAFETY_LOCKS = RENT_LOCKS_SAFE;

export default RENT_LOCKS_SAFE;