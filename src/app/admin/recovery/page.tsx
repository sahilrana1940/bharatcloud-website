import { redirect } from "next/navigation";

import { RecoveryAdminClient } from "@/components/admin/RecoveryAdminClient";
import { getSessionRole } from "@/lib/auth";
import { SUPER_ADMIN_EMAIL } from "@/lib/b2b/constants";

export default async function AdminRecoveryPage() {
  const role = await getSessionRole();
  if (!role || (role.role !== "super_admin" && role.email !== SUPER_ADMIN_EMAIL)) {
    redirect("/dashboard");
  }
  return <RecoveryAdminClient />;
}
