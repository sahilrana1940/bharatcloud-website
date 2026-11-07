import { cookies } from "next/headers";

import { SuperAdminSession } from "@/components/super-admin/SuperAdminSession";
import { PLATFORM_NAME, SUPER_ADMIN_OWNER } from "@/lib/constants";
import { WS_EMAIL_COOKIE } from "@/lib/workspace/session";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const viewerEmail = (jar.get(WS_EMAIL_COOKIE)?.value || "").trim().toLowerCase();
  const canDeleteOwner = viewerEmail === SUPER_ADMIN_OWNER;

  return (
    <SuperAdminSession
      viewerEmail={viewerEmail}
      platformName={PLATFORM_NAME}
      canDeleteOwner={canDeleteOwner}
    >
      {children}
    </SuperAdminSession>
  );
}
