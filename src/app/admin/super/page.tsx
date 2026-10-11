import { redirect } from "next/navigation";

import { SuperAdminUltraPro } from "@/components/admin/SuperAdminUltraPro";
import { isSuperAdminEmail } from "@/lib/brand";
import { getWorkspaceSession } from "@/lib/workspace/session";

export default async function SuperAdminPage() {
  const session = await getWorkspaceSession();
  if (!session || !isSuperAdminEmail(session.email)) {
    redirect("/dashboard");
  }
  return <SuperAdminUltraPro />;
}
