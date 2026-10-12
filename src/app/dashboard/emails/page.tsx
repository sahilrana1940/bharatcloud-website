import { redirect } from "next/navigation";

import { isEmailBackupEnabled } from "@/lib/feature-flags";

/** Email backup disabled — Drive + CCTV only. */
export default async function EmailsPage() {
  if (!isEmailBackupEnabled()) {
    redirect("/dashboard/team");
  }
  redirect("/dashboard/team");
}
