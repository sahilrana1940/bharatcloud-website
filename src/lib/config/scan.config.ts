import { RENT } from "@/lib/config/rent.config";

/**
 * GoDaddy mailbox scan.
 * Pending forward = (activeFound - registered) * employee intro rent * months.
 *  (6 - 2) * 49 * 4 = 784
 */
export const GODADDY_SCAN = {
  provider: "GoDaddy",
  activeFound: 6,
  registered: 2,
  pendingMonths: 4,
  coveragePct: 83,
  coverageState: "FAILED" as const,
  forwardRateInr: RENT.employeeFirst30DaysInr,
};

export function unregisteredSeats(scan: typeof GODADDY_SCAN = GODADDY_SCAN): number {
  return Math.max(0, scan.activeFound - scan.registered);
}

export function forwardPendingInr(scan: typeof GODADDY_SCAN = GODADDY_SCAN): number {
  return unregisteredSeats(scan) * scan.forwardRateInr * scan.pendingMonths;
}

export const RENT_LOCKS = {
  pause: {
    afterDays: 7,
    backup: "OFF" as const,
    storage: "SAFE" as const,
    label: "Pause",
  },
  readOnly: {
    afterDays: 30,
    access: "Read-only" as const,
  },
} as const;
