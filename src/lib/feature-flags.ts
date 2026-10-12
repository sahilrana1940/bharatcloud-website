/** B2C personal cloud — disabled for B2B-only go-live. */
export function isB2cEnabled(): boolean {
  return process.env.ENABLE_B2C === "1";
}

export function isDemoLoginEnabled(): boolean {
  return process.env.ENABLE_DEMO_LOGINS === "1";
}

/** Gmail / email archive — off by default (GOR JRM: Drive + CCTV only). */
export function isEmailBackupEnabled(): boolean {
  return process.env.ENABLE_EMAIL_BACKUP === "1";
}
