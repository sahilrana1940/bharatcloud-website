import { redirect } from "next/navigation";

import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { getSessionRole } from "@/lib/auth";
import { isPlatformAdminSession } from "@/lib/admin/access";

export default async function AdminHomePage() {
  const role = await getSessionRole();
  if (!isPlatformAdminSession(role)) {
    redirect("/dashboard");
  }
  return <AdminDashboardClient />;
}
