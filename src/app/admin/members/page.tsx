import { redirect } from "next/navigation";

import { MembersAdminClient } from "@/components/admin/MembersAdminClient";
import { isPlatformAdminSession } from "@/lib/admin/access";
import { getSessionRole } from "@/lib/auth";

export default async function AdminMembersPage() {
  const role = await getSessionRole();
  if (!isPlatformAdminSession(role)) redirect("/login");
  return <MembersAdminClient />;
}
