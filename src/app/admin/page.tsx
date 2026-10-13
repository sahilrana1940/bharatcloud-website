import { redirect } from "next/navigation";

import { PlatformAdminHub } from "@/components/admin/PlatformAdminHub";
import { getSessionRole } from "@/lib/auth";
import { isPlatformAdminSession } from "@/lib/admin/access";

export default async function AdminHomePage() {
  const role = await getSessionRole();
  if (!isPlatformAdminSession(role)) {
    redirect("/dashboard");
  }
  return <PlatformAdminHub />;
}
