import { redirect } from "next/navigation";

import { isB2cEnabled } from "@/lib/feature-flags";

/** B2C personal product — gated off for B2B-only launch. */
export default function PersonalPage() {
  if (!isB2cEnabled()) {
    redirect("/login");
  }
  redirect("/dashboard/drive");
}
