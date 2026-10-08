import { NextResponse } from "next/server";

import { getB2BCompanyId } from "@/lib/b2b/session";
import { DEMO_COMPANY, getSupabaseAdmin } from "@/lib/supabase/server";
import { bytesToGb, getS3Client, listCompanyFiles } from "@/lib/s3/client";

export async function GET() {
  const companyId = await getB2BCompanyId();
  if (!companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  let limitGb = DEMO_COMPANY.storage_limit_gb;
  if (supabase) {
    const { data } = await supabase
      .from("b2b_companies")
      .select("storage_limit_gb")
      .eq("id", companyId)
      .single();
    if (data?.storage_limit_gb) limitGb = data.storage_limit_gb;
  }

  const client = getS3Client();
  let usedGb = 320;
  if (client) {
    const objects = await listCompanyFiles(client, companyId);
    const bytes = objects.reduce((sum, o) => sum + (o.Size || 0), 0);
    usedGb = bytesToGb(bytes) || 0;
  } else if (supabase) {
    const { data: ids } = await supabase
      .from("b2b_ids")
      .select("storage_used_gb")
      .eq("company_id", companyId);
    usedGb =
      (ids || []).reduce(
        (s, r) => s + Number(r.storage_used_gb || 0),
        0,
      ) || 0;
  }

  return NextResponse.json({ usedGb, limitGb });
}
