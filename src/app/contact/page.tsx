import type { Metadata } from "next";

import { ContactForm } from "@/components/marketing/ContactForm";
import { DarkSiteShell } from "@/components/marketing/DarkSiteShell";

export const metadata: Metadata = {
  title: "Contact · BharatCloud.store",
  description: "Talk to BharatCloud sales about storage for your team in India.",
};

const DETAILS = [
  { label: "Email", value: "sales@bharatcloud.store", href: "mailto:sales@bharatcloud.store" },
  { label: "Phone", value: "Request a callback in the form", href: "#sales-form" },
  { label: "Address", value: "Mumbai, Maharashtra, India", href: undefined },
];

export default function ContactPage() {
  return (
    <DarkSiteShell active="contact">
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-black text-white sm:text-5xl">Talk to Sales</h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-gray-400">
            Tell us the team size and the storage you need. We reply from Mumbai.
          </p>
          <ul className="mt-10 space-y-6">
            {DETAILS.map((item) => (
              <li key={item.label}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-300">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="mt-1 block text-lg text-white hover:text-orange-200">
                    {item.value}
                  </a>
                ) : (
                  <p className="mt-1 text-lg text-white">{item.value}</p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div id="sales-form" className="relative">
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-orange-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-6 top-8 -z-10 h-48 w-48 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-8 -z-10 h-40 w-40 rounded-full bg-purple-500/25 blur-3xl" />
          <ContactForm />
        </div>
      </div>
    </DarkSiteShell>
  );
}
