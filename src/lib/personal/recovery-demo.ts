export type RecoveryRow = {
  id: string;
  user_email: string;
  contact_mail: string;
  reason: string;
  status: string;
  backup_code_hash: string | null;
  backup_code_plain_temp: string | null;
  code_expires_at: string | null;
  created_at: string;
};

const rows: RecoveryRow[] = [];

export function demoRecoveryInsert(r: RecoveryRow) {
  rows.unshift(r);
  return r;
}

export function demoRecoveryListPending() {
  return rows.filter((r) => r.status === "pending");
}

export function demoRecoveryGet(id: string) {
  return rows.find((r) => r.id === id);
}

export function demoRecoveryUpdate(id: string, patch: Partial<RecoveryRow>) {
  const i = rows.findIndex((r) => r.id === id);
  if (i >= 0) rows[i] = { ...rows[i], ...patch };
  return rows[i];
}

export function demoRecoveryFindByEmailCode(email: string, code: string, hashFn: (c: string) => string) {
  const h = hashFn(code.replace(/\s/g, ""));
  return rows.find(
    (r) =>
      r.user_email === email.toLowerCase() &&
      r.status === "approved" &&
      r.backup_code_hash === h,
  );
}
