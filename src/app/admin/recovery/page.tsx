import { redirect } from "next/navigation";

import { RecoveryAdminClient } from "@/components/admin/RecoveryAdminClient";
import { getSessionRole } from "@/lib/auth";
import { isPlatformAdminSession } from "@/lib/admin/access";

export default async function AdminRecoveryPage() {
  const role = await getSessionRole();
  if (!isPlatformAdminSession(role)) {
    redirect("/dashboard");
  }
  return <RecoveryAdminClient />;
}
