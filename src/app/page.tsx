import type { Metadata } from "next";

import { LandingView } from "@/components/saas/LandingView";

export const metadata: Metadata = {
  title: "Bharat Cloud.store",
  description: "Mumbai E2E company storage with fixed mailbox caps.",
};

export default function HomePage() {
  return <LandingView />;
}
