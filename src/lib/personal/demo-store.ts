export type VaultRow = {
  id: string;
  user_email: string;
  company_domain: string | null;
  file_name: string;
  file_size: number;
  type: "photo" | "video" | "whatsapp" | "file" | "company_doc";
  hot_path: string | null;
  cold_path: string | null;
  vault_path: string;
  storage_tier: "hot" | "cold";
  is_deleted: boolean;
  is_locked: boolean;
  created_at: string;
  last_accessed: string;
  mime_type?: string | null;
};

const rows: VaultRow[] = [];

export function demoVaultList(email: string, companyDomain: string | null, asOwner: boolean) {
  const e = email.toLowerCase();
  return rows.filter((r) => {
    if (r.is_deleted) return false;
    if (!companyDomain) return r.user_email === e && !r.company_domain;
    if (asOwner) return r.company_domain === companyDomain;
    return r.user_email === e || r.company_domain === companyDomain;
  });
}

export function demoVaultGet(id: string) {
  return rows.find((r) => r.id === id);
}

export function demoVaultInsert(row: VaultRow) {
  rows.unshift(row);
  return row;
}

export function demoVaultUpdate(id: string, patch: Partial<VaultRow>) {
  const i = rows.findIndex((r) => r.id === id);
  if (i >= 0) rows[i] = { ...rows[i], ...patch };
  return rows[i];
}

export function demoStorageStats(companyDomain?: string | null) {
  let hot = 0;
  let cold = 0;
  let vault = 0;
  for (const r of rows) {
    if (companyDomain && r.company_domain !== companyDomain) continue;
    vault += r.file_size;
    if (r.storage_tier === "cold") cold += r.file_size;
    else if (!r.is_deleted) hot += r.file_size;
  }
  return { hot, cold, vault, count: rows.length };
}

export function demoPersonalList(email: string) {
  return demoVaultList(email, null, false);
}
export const demoPersonalGet = demoVaultGet;
export const demoPersonalInsert = demoVaultInsert;
export const demoPersonalUpdate = demoVaultUpdate;
