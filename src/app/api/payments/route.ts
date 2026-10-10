import { NextResponse } from "next/server";

import {
  demoPaymentInsert,
  demoPaymentsList,
} from "@/lib/payments/store";
import { requireWorkspace } from "@/lib/workspace/auth-api";
import { resolveCompanyDomain } from "@/lib/workspace/company";
import { getSupabaseOrNull } from "@/lib/workspace/db";

const DEFAULT_AMOUNT = 1999;

export async function GET() {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;
  const domain = await resolveCompanyDomain(session.companyId, session.email);
  const supabase = await getSupabaseOrNull();

  if (!supabase) {
    return NextResponse.json({
      payments: demoPaymentsList().filter((p) => p.company_domain === domain),
    });
  }

  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("company_domain", domain)
    .order("created_at", { ascending: false });

  return NextResponse.json({ payments: data || [] });
}

export async function POST(req: Request) {
  const auth = await requireWorkspace();
  if (auth instanceof NextResponse) return auth;
  const { session } = auth;

  let amount = DEFAULT_AMOUNT;
  try {
    const body = await req.json();
    if (body.amount) amount = Number(body.amount);
  } catch {
    /* default amount */
  }

  const domain = await resolveCompanyDomain(session.companyId, session.email);
  const supabase = await getSupabaseOrNull();

  if (!supabase) {
    const row = demoPaymentInsert(domain, amount);
    return NextResponse.json({ ok: true, payment: row });
  }

  const { data, error } = await supabase
    .from("payments")
    .insert({
      company_domain: domain,
      amount,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, payment: data });
}
