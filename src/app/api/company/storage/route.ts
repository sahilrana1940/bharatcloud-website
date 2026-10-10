import { NextResponse } from "next/server";

import { demoStorageStats } from "@/lib/personal/demo-store";
import { getUploadContext } from "@/lib/personal/access";
import { VAULT_TABLE } from "@/lib/vault/table";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const ctx = await getUploadContext();
  if (!ctx?.companyDomain) {
    return NextResponse.json({ error: "B2B only" }, { status: 400 });
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const d = demoStorageStats(ctx.companyDomain);
    return NextResponse.json({
      hotGb: (d.hot / 1024 ** 3).toFixed(2),
      coldGb: (d.cold / 1024 ** 3).toFixed(2),
      vaultGb: (d.vault / 1024 ** 3).toFixed(2),
    });
  }

  const { data } = await supabase
    .from(VAULT_TABLE)
    .select("file_size, storage_tier, is_deleted")
    .eq("company_domain", ctx.companyDomain);

  let hot = 0;
  let cold = 0;
  let vault = 0;
  for (const r of data || []) {
    const sz = Number(r.file_size || 0);
    vault += sz;
    if (r.storage_tier === "cold") cold += sz;
    else if (!r.is_deleted) hot += sz;
  }

  return NextResponse.json({
    hotGb: (hot / 1024 ** 3).toFixed(2),
    coldGb: (cold / 1024 ** 3).toFixed(2),
    vaultGb: (vault / 1024 ** 3).toFixed(2),
  });
}
