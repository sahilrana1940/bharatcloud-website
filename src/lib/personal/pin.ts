import { createHash } from "crypto";

const PIN_SALT = process.env.BC_PIN_SALT || "bharatcloud-pin-salt";

export function hashPin(pin: string) {
  return createHash("sha256").update(`${PIN_SALT}:${pin}`).digest("hex");
}

export function hashBackupCode(code: string) {
  return createHash("sha256").update(`${PIN_SALT}:backup:${code.replace(/\s/g, "")}`).digest("hex");
}

export function generateBackupCode(): string {
  const seg = () => Math.floor(1000 + Math.random() * 9000);
  return `BHARAT-${seg()}-${seg()}`;
}

export function generateWords12(): string {
  return generateBackupCode();
}
