import { redirect } from "next/navigation";

import { AdminMailArchiveSearch } from "@/components/admin/AdminMailArchiveSearch";
import { isPlatformAdminSession } from "@/lib/admin/access";
import { getSessionRole } from "@/lib/auth";

export default async function AdminMailArchivePage() {
  const role = await getSessionRole();
  if (!isPlatformAdminSession(role)) redirect("/login");

  return (
    <div className="px-4 py-8 sm:px-8">
      <AdminMailArchiveSearch />
    </div>
  );
}
