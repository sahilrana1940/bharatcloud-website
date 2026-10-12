/** B2C personal cloud — disabled for B2B-only go-live. */
export function isB2cEnabled(): boolean {
  return process.env.ENABLE_B2C === "1";
}

export function isDemoLoginEnabled(): boolean {
  return process.env.ENABLE_DEMO_LOGINS === "1";
}
