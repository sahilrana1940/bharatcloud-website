import { redirect } from "next/navigation";

import { StorageAdminClient } from "@/components/admin/StorageAdminClient";
import { getSessionRole } from "@/lib/auth";
import { isPlatformAdminSession } from "@/lib/admin/access";

export default async function AdminStoragePage() {
  const role = await getSessionRole();
  if (!isPlatformAdminSession(role)) {
    redirect("/dashboard");
  }
  return <StorageAdminClient />;
}
