import type { Metadata } from "next";

import { SuperAdminConsole } from "@/components/saas/SuperAdminConsole";

export const metadata: Metadata = {
  title: "Super admin · Bharat Cloud",
};

export default function SuperAdminPage() {
  return <SuperAdminConsole />;
}
