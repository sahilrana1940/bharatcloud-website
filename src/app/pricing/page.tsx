import type { Metadata } from "next";

import { PricingView } from "@/components/saas/PricingView";

export const metadata: Metadata = {
  title: "Pricing · Bharat Cloud",
};

export default function PricingPage() {
  return <PricingView />;
}
