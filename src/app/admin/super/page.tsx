import { redirect } from "next/navigation";

import { SuperAdminClient } from "@/components/admin/SuperAdminClient";
import { SUPER_ADMIN_EMAIL } from "@/lib/brand";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function SuperAdminPage() {
  const session = await getWorkspaceSession();
  if (!session || session.email.toLowerCase() !== SUPER_ADMIN_EMAIL) {
    redirect("/dashboard");
  }
  return <SuperAdminClient />;
}
