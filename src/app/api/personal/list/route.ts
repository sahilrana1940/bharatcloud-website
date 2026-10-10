import { NextResponse } from "next/server";

import { getSessionRole } from "@/lib/auth";
import { demoVaultList } from "@/lib/personal/demo-store";
import { demoGetUser } from "@/lib/personal/users-demo";
import { getUploadContext } from "@/lib/personal/access";
import { signThumbPath } from "@/lib/vault/sign";
import { VAULT_TABLE } from "@/lib/vault/table";
import { getSupabaseOrNull } from "@/lib/workspace/db";

const PAGE = 20;

export async function GET(req: Request) {
  const ctx = await getUploadContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const offset = (page - 1) * PAGE;

  const role = await getSessionRole();
  const isOwner = Boolean(role?.is_company_owner || role?.role === "company_owner");

  const supabase = await getSupabaseOrNull();
  if (!supabase) {
    let items = demoVaultList(ctx.email, ctx.companyDomain, isOwner);
    if (type && type !== "qr") {
      if (ctx.companyDomain && type === "video") {
        items = items.filter((i) =>
          ["video", "company_doc", "file"].includes(i.type),
        );
      } else {
        items = items.filter((i) => i.type === type);
      }
    }
    const slice = items.slice(offset, offset + PAGE);
    const withThumbs = await Promise.all(
      slice.map(async (i) => ({
        id: i.id,
        file_name: i.file_name,
        file_size: i.file_size,
        type: i.type,
        storage_tier: i.storage_tier,
        thumbUrl: i.thumb_path ? await signThumbPath(i.thumb_path) : null,
      })),
    );
    const user = demoGetUser(ctx.email);
    return NextResponse.json({
      items: withThumbs,
      page,
      hasMore: items.length > offset + PAGE,
      plan: user,
      b2c: !ctx.companyDomain,
    });
  }

  let query = supabase.from(VAULT_TABLE).select("*", { count: "exact" }).eq("is_deleted", false);
  if (!ctx.companyDomain) {
    query = query.eq("user_email", ctx.email).is("company_domain", null);
  } else if (isOwner) {
    query = query.eq("company_domain", ctx.companyDomain);
  } else {
    query = query.eq("user_email", ctx.email);
    if (ctx.companyDomain) {
      query = query.or(
        `company_domain.eq.${ctx.companyDomain},company_domain.is.null`,
      );
    }
  }
  if (type && type !== "qr") {
    if (ctx.companyDomain && type === "video") {
      query = query.in("type", ["video", "company_doc", "file"]);
    } else {
      query = query.eq("type", type);
    }
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE - 1);

  const withThumbs = await Promise.all(
    (data || []).map(async (i) => ({
      id: i.id,
      file_name: i.file_name,
      file_size: i.file_size,
      type: i.type,
      storage_tier: i.storage_tier,
      thumbUrl: i.thumb_path ? await signThumbPath(i.thumb_path as string) : null,
    })),
  );

  const { data: plan } = await supabase
    .from("personal_users")
    .select("*")
    .eq("email", ctx.email)
    .maybeSingle();

  return NextResponse.json({
    items: withThumbs,
    page,
    hasMore: (count || 0) > offset + PAGE,
    plan,
    b2c: !ctx.companyDomain,
  });
}
