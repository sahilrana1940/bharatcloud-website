import { redirect } from "next/navigation";

import { GmailConnectAdminClient } from "@/components/admin/GmailConnectAdminClient";
import { isPlatformAdminSession } from "@/lib/admin/access";
import { getSessionRole } from "@/lib/auth";

export default async function AdminGmailPage() {
  const role = await getSessionRole();
  if (!isPlatformAdminSession(role)) redirect("/login");
  return <GmailConnectAdminClient />;
}
