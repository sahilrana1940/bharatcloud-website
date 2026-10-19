import type { Metadata } from "next";

import { DashboardConsole } from "@/components/saas/DashboardConsole";

export const metadata: Metadata = {
  title: "Dashboard · Bharat Cloud",
};

export default function DashboardPage() {
  return <DashboardConsole />;
}
