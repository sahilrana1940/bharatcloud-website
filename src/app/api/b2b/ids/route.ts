import { NextResponse } from "next/server";

import { getB2BCompanyId } from "@/lib/b2b/session";
import {
  DEMO_COMPANY,
  DEMO_IDS,
  getSupabaseAdmin,
  type B2BId,
} from "@/lib/supabase/server";
import { companyPrefix, ensureFolder, getS3Client } from "@/lib/s3/client";

export async function GET() {
  const companyId = await getB2BCompanyId();
  if (!companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ids: DEMO_IDS });
  }

  const { data, error } = await supabase
    .from("b2b_ids")
    .select("*")
    .eq("company_id", companyId)
    .order("last_active_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ids: data as B2BId[] });
}

export async function POST(req: Request) {
  const companyId = await getB2BCompanyId();
  if (!companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const emailPrefix = String(body.emailPrefix || "").trim();
  if (!emailPrefix.includes("@")) {
    return NextResponse.json(
      { error: "Valid email prefix required (e.g. hr@company.com)" },
      { status: 400 },
    );
  }

  const localPart = emailPrefix.split("@")[0];
  const s3Prefix = `${companyPrefix(companyId)}${localPart}/`;

  const client = getS3Client();
  if (client) {
    await ensureFolder(client, s3Prefix);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const row: B2BId = {
      id: `demo-${Date.now()}`,
      company_id: DEMO_COMPANY.id,
      email_prefix: emailPrefix,
      storage_used_gb: 0,
      last_active_at: new Date().toISOString(),
      s3_prefix: s3Prefix,
    };
    DEMO_IDS.push(row);
    return NextResponse.json({ id: row });
  }

  const { data, error } = await supabase
    .from("b2b_ids")
    .insert({
      company_id: companyId,
      email_prefix: emailPrefix,
      s3_prefix: s3Prefix,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data });
}
