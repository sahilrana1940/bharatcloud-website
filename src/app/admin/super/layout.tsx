import { redirect } from "next/navigation";

import { isSuperAdminEmail } from "@/lib/brand";
import { getSessionRole } from "@/lib/auth";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getSessionRole();
  if (!role?.email || (!isSuperAdminEmail(role.email) && role.role !== "super_admin")) {
    redirect("/dashboard");
  }
  return children;
}
