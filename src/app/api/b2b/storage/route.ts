import { NextResponse } from "next/server";

import { demoOrganizations } from "@/lib/b2b/demo-orgs";
import { GB } from "@/lib/b2b/plans";
import { getB2BCompanyId } from "@/lib/b2b/session";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { bytesToGb, getS3Client, listCompanyFiles } from "@/lib/s3/client";

export async function GET() {
  const orgId = await getB2BCompanyId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  let limitBytes = 100 * GB;
  let usedBytes = 5 * GB;

  if (!supabase) {
    const org = demoOrganizations.find((o) => o.id === orgId);
    if (org) {
      limitBytes = org.storage_limit;
      usedBytes = org.storage_used;
    }
  } else {
    const { data } = await supabase
      .from("organizations")
      .select("storage_limit, storage_used")
      .eq("id", orgId)
      .single();
    if (data) {
      limitBytes = Number(data.storage_limit);
      usedBytes = Number(data.storage_used);
    }
  }

  const client = getS3Client();
  if (client) {
    const objects = await listCompanyFiles(client, orgId);
    const bytes = objects.reduce((sum, o) => sum + (o.Size || 0), 0);
    usedBytes = Math.max(usedBytes, Math.round(bytes));
  }

  const limitGb = bytesToGb(limitBytes) || limitBytes / GB;
  const usedGb = bytesToGb(usedBytes) || usedBytes / GB;

  return NextResponse.json({
    usedGb,
    limitGb,
    usedBytes,
    limitBytes,
  });
}
