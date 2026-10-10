import { NextResponse } from "next/server";

import { demoVaultList } from "@/lib/personal/demo-store";
import { signHotOrCold } from "@/lib/vault/sign";
import { getUploadContext } from "@/lib/personal/access";
import { VAULT_TABLE } from "@/lib/vault/table";
import { getSupabaseOrNull } from "@/lib/workspace/db";

/** After verify — return signed URLs for all user files (ZIP client-side assembly) */
export async function GET() {
  const ctx = await getUploadContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    const rows = demoVaultList(ctx.email, null, false);
    return NextResponse.json({
      files: rows.map((r) => ({ id: r.id, name: r.file_name })),
      note: "Call /api/secure-download per file after recovery verify",
    });
  }

  const { data } = await supabase
    .from(VAULT_TABLE)
    .select("*")
    .eq("user_email", ctx.email)
    .eq("is_deleted", false);

  const urls: { name: string; url: string | null }[] = [];
  for (const row of data || []) {
    const url = await signHotOrCold(row, true);
    urls.push({ name: row.file_name as string, url });
  }

  return NextResponse.json({ files: urls });
}
