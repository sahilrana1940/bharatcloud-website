import type { Metadata } from "next";

import { DarkSiteShell } from "@/components/marketing/DarkSiteShell";
import { ScrollFeatures } from "@/components/marketing/ScrollFeatures";

export const metadata: Metadata = {
  title: "Features · BharatCloud.store",
  description: "Encryption, India data residency, uptime, collaboration, API access, and analytics.",
};

export default function FeaturesPage() {
  return (
    <DarkSiteShell active="features">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-white sm:text-5xl">Everything you need to scale</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
          Security, residency, and the tools a growing team uses every day.
        </p>
      </div>
      <ScrollFeatures />
    </DarkSiteShell>
  );
}
