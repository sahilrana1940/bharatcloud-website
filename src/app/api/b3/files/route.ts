import { NextResponse } from "next/server";

import { listB3Files } from "@/lib/b3/repository";
import { B3_DEFAULT_LIMIT_GB } from "@/lib/b3/types";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session, tenant } = auth;
  const companyId = tenant?.companyId ?? session.companyId;

  const supabase = await getSupabaseOrNull();
  const limitGb =
    Number(tenant?.company.storage_limit_gb) > 0
      ? Math.min(Number(tenant?.company.storage_limit_gb), 1024)
      : B3_DEFAULT_LIMIT_GB;

  const { files, usedBytes, limitGb: cap } = await listB3Files(supabase, companyId, limitGb);

  return NextResponse.json({
    files: files.map((f) => ({
      id: f.id,
      companyId: f.companyId,
      fileName: f.fileName,
      fileUrl: f.fileUrl,
      fileSize: f.fileSize,
      aiTag: f.aiTag,
      createdAt: f.createdAt,
    })),
    usedBytes,
    usedGb: usedBytes / (1024 ** 3),
    limitGb: cap,
  });
}
