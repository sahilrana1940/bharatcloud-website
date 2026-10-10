export type PersonalBackupRow = {
  id: string;
  user_email: string;
  file_name: string;
  hot_path: string | null;
  cold_path: string | null;
  vault_path: string;
  hot_url: string | null;
  cold_url: string | null;
  vault_url: string;
  file_size: number;
  type: "photo" | "video" | "whatsapp" | "file";
  storage_tier: "hot" | "cold" | "vault";
  created_at: string;
  last_accessed: string;
  is_deleted: boolean;
  company_domain: string | null;
  mime_type?: string | null;
};

const rows: PersonalBackupRow[] = [];

export function demoPersonalList(email: string) {
  return rows.filter((r) => r.user_email === email.toLowerCase());
}

export function demoPersonalGet(id: string) {
  return rows.find((r) => r.id === id);
}

export function demoPersonalInsert(row: PersonalBackupRow) {
  rows.unshift(row);
  return row;
}

export function demoPersonalUpdate(id: string, patch: Partial<PersonalBackupRow>) {
  const i = rows.findIndex((r) => r.id === id);
  if (i >= 0) rows[i] = { ...rows[i], ...patch };
  return rows[i];
}

export function demoStorageStats() {
  let hot = 0;
  let cold = 0;
  let vault = 0;
  for (const r of rows) {
    vault += r.file_size;
    if (r.storage_tier === "cold") cold += r.file_size;
    else if (!r.is_deleted) hot += r.file_size;
  }
  return { hot, cold, vault, count: rows.length };
}
