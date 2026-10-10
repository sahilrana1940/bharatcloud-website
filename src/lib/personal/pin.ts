import { createHash, randomBytes } from "crypto";

const PIN_SALT = process.env.BC_PIN_SALT || "bharatcloud-pin-salt";

export function hashPin(pin: string) {
  return createHash("sha256").update(`${PIN_SALT}:${pin}`).digest("hex");
}

export function hashBackupCode(code: string) {
  return createHash("sha256").update(`${PIN_SALT}:backup:${code}`).digest("hex");
}

export function generateBackupCode(): string {
  const n = () => Math.floor(1000 + Math.random() * 9000);
  return `${n()}-${n()}`;
}

export function generateWords12(): string {
  const w = ["mumbai", "vault", "secure", "bharat", "cloud", "hot", "cold", "data", "hd", "lock", "safe", "india"];
  const out: string[] = [];
  for (let i = 0; i < 12; i++) {
    out.push(w[Math.floor(Math.random() * w.length)] + randomBytes(1).toString("hex").slice(0, 2));
  }
  return out.join(" ");
}
