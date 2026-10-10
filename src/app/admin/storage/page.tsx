import { redirect } from "next/navigation";

import { StorageAdminClient } from "@/components/admin/StorageAdminClient";
import { getSessionRole } from "@/lib/auth";
import { SUPER_ADMIN_EMAIL } from "@/lib/b2b/constants";

export default async function AdminStoragePage() {
  const role = await getSessionRole();
  if (!role || (role.role !== "super_admin" && role.email !== SUPER_ADMIN_EMAIL)) {
    redirect("/dashboard");
  }
  return <StorageAdminClient />;
}
