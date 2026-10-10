import { PaymentsAdminClient } from "@/components/admin/PaymentsAdminClient";
import { isSuperAdminSession } from "@/lib/b2b/session";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function AdminPaymentsPage() {
  const superOk = await isSuperAdminSession();
  const ws = await getWorkspaceSession();
  const authed = superOk || ws?.role === "admin";
  return <PaymentsAdminClient authed={authed} />;
}
