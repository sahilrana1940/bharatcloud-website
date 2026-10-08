import { SuperAdminClient } from "@/components/b2b/SuperAdminClient";
import { isSuperAdminSession } from "@/lib/b2b/session";

export default async function SuperAdminPage() {
  const authed = await isSuperAdminSession();
  return <SuperAdminClient authed={authed} />;
}
