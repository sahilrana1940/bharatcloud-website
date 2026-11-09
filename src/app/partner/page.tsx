import type { Metadata } from "next";

import { PartnerDashboard } from "@/components/partner/PartnerDashboard";

export const metadata: Metadata = {
  title: "Partner Dashboard · BharatCloud",
  description: "B2B partner login for BharatCloud. Business accounts only.",
};

export default function PartnerPage() {
  return <PartnerDashboard />;
}
