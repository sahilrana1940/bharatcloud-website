type LockRow = {
  user_email: string;
  pin_hash: string;
  biometric_enabled: boolean;
  failed_attempts: number;
  is_device_locked: boolean;
  backup_code_hash: string | null;
};

const locks = new Map<string, LockRow>();
const unlocked = new Set<string>();

export function demoGetLock(email: string) {
  return locks.get(email.toLowerCase());
}

export function demoSetLock(row: LockRow) {
  locks.set(row.user_email.toLowerCase(), row);
}

export function demoIsUnlocked(email: string) {
  return unlocked.has(email.toLowerCase());
}

export function demoSetUnlocked(email: string, v: boolean) {
  if (v) unlocked.add(email.toLowerCase());
  else unlocked.delete(email.toLowerCase());
}
