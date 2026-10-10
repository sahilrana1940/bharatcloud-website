import { NextResponse } from "next/server";

import { getSessionRole } from "@/lib/auth";
import { demoVaultList } from "@/lib/personal/demo-store";
import { demoGetUser } from "@/lib/personal/users-demo";
import { getUploadContext } from "@/lib/personal/access";
import { VAULT_TABLE } from "@/lib/vault/table";
import { getSupabaseOrNull } from "@/lib/workspace/db";

export async function GET(req: Request) {
  const ctx = await getUploadContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = new URL(req.url).searchParams.get("type");
  const role = await getSessionRole();
  const isOwner = Boolean(role?.is_company_owner || role?.role === "company_owner");

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    let items = demoVaultList(ctx.email, ctx.companyDomain, isOwner);
    if (type) items = items.filter((i) => i.type === type);
    const user = demoGetUser(ctx.email);
    return NextResponse.json({
      items,
      plan: user,
      b2c: !ctx.companyDomain,
    });
  }

  let query = supabase.from(VAULT_TABLE).select("*").eq("is_deleted", false);
  if (!ctx.companyDomain) {
    query = query.eq("user_email", ctx.email).is("company_domain", null);
  } else if (isOwner) {
    query = query.eq("company_domain", ctx.companyDomain);
  } else {
    query = query.or(
      `user_email.eq.${ctx.email},company_domain.eq.${ctx.companyDomain}`,
    );
  }
  if (type) query = query.eq("type", type);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: plan } = await supabase
    .from("personal_users")
    .select("*")
    .eq("user_email", ctx.email)
    .maybeSingle();

  return NextResponse.json({
    items: data || [],
    plan,
    b2c: !ctx.companyDomain,
  });
}
