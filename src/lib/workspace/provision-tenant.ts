import type { SupabaseClient } from "@supabase/supabase-js";

import { emailDomain } from "@/lib/google/client";
import { e2eWorkspacePrefix } from "@/lib/roles/platform-roles";

export async function provisionTenantAdmin(
  supabase: SupabaseClient,
  opts: { ownerEmail: string; companyId?: string | null; planPaid?: boolean; paytmTxn?: string },
) {
  const email = opts.ownerEmail.trim().toLowerCase();
  const domain = emailDomain(email);
  if (!domain) return;

  const e2e_prefix = e2eWorkspacePrefix(domain);

  const { data: ws } = await supabase
    .from("workspaces")
    .upsert(
      {
        domain,
        owner_email: email,
        company_id: opts.companyId || null,
        plan_paid: opts.planPaid ?? false,
        paytm_txn: opts.paytmTxn || null,
        e2e_prefix,
      },
      { onConflict: "domain" },
    )
    .select("id")
    .single();

  if (!ws?.id) return;

  await supabase.from("platform_users").upsert(
    {
      email,
      role: "Admin",
      workspace_id: ws.id,
      plan_paid: opts.planPaid ?? false,
      paytm_txn: opts.paytmTxn || null,
    },
    { onConflict: "email" },
  );

  if (opts.companyId) {
    await supabase.from("company_users").upsert(
      {
        company_id: opts.companyId,
        email,
        role: "admin",
        saas_role: "company_owner",
        is_company_owner: true,
      },
      { onConflict: "company_id,email" },
    );
  }
}

export async function markWorkspacePaid(
  supabase: SupabaseClient,
  opts: { ownerEmail: string; paytmTxn?: string },
) {
  const email = opts.ownerEmail.trim().toLowerCase();

  await supabase
    .from("workspaces")
    .update({ plan_paid: true, paytm_txn: opts.paytmTxn || null })
    .eq("owner_email", email);

  await supabase
    .from("platform_users")
    .update({ plan_paid: true, paytm_txn: opts.paytmTxn || null })
    .eq("email", email);
}
