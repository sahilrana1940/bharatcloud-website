import { redirect } from "next/navigation";

import { PaymentsAdminClient } from "@/components/admin/PaymentsAdminClient";
import { isPlatformAdminSession } from "@/lib/admin/access";
import { getSessionRole } from "@/lib/auth";

export default async function AdminPaymentsPage() {
  const role = await getSessionRole();
  if (!isPlatformAdminSession(role)) redirect("/login");
  return <PaymentsAdminClient />;
}
