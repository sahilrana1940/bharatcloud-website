import { redirect } from "next/navigation";

import { SuperAdminClient } from "@/components/admin/SuperAdminClient";
import { isSuperAdminEmail } from "@/lib/brand";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function SuperAdminPage() {
  const session = await getWorkspaceSession();
  if (!session || !isSuperAdminEmail(session.email)) {
    redirect("/dashboard");
  }
  return <SuperAdminClient />;
}
