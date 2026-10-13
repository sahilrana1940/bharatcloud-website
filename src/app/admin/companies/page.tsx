import { redirect } from "next/navigation";

import { CompaniesAdminClient } from "@/components/admin/CompaniesAdminClient";
import { isPlatformAdminSession } from "@/lib/admin/access";
import { getSessionRole } from "@/lib/auth";

export default async function AdminCompaniesPage() {
  const role = await getSessionRole();
  if (!isPlatformAdminSession(role)) {
    redirect("/dashboard");
  }
  return <CompaniesAdminClient />;
}
