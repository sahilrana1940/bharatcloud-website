import { getSupabaseOrNull } from "@/lib/workspace/db";

export function googleConnectRequiresAdminApproval(): boolean {
  return process.env.GMAIL_CONNECT_REQUIRES_APPROVAL === "1";
}

export type GoogleConnectGate =
  | { allowed: true }
  | { allowed: false; status: string; message: string };

export async function checkGoogleConnectAllowed(
  email: string,
  companyId: string,
): Promise<GoogleConnectGate> {
  if (!googleConnectRequiresAdminApproval()) {
    return { allowed: true };
  }

  const supabase = await getSupabaseOrNull();
  if (!supabase) return { allowed: true };

  const normalized = email.trim().toLowerCase();
  const { data: row } = await supabase
    .from("company_users")
    .select("google_connect_status")
    .eq("company_id", companyId)
    .eq("email", normalized)
    .maybeSingle();

  const status = (row?.google_connect_status as string) || "approved";
  if (status === "approved") return { allowed: true };

  if (status === "pending_approval") {
    return {
      allowed: false,
      status,
      message:
        "Gmail/Drive connect is waiting for BharatCloud super admin approval. Contact support@bharatcloud.com.",
    };
  }

  await supabase.from("company_users").upsert(
    {
      company_id: companyId,
      email: normalized,
      google_connect_status: "pending_approval",
      role: "member",
      saas_role: "employee",
    },
    { onConflict: "company_id,email" },
  );

  return {
    allowed: false,
    status: "pending_approval",
    message:
      "Request sent to BharatCloud admin. Gmail/Drive connect will work after super admin approves your email.",
  };
}
