import Link from "next/link";

import { SAAS_PLANS } from "@/lib/b2b/plans";
import { SiteHeader } from "@/components/b2b/SiteHeader";

const features = [
  {
    title: "Team Control",
    body: "Add admins and members, assign roles, and keep access in your company — not scattered apps.",
  },
  {
    title: "Shared Storage",
    body: "One secure vault for contracts, GST files, and field photos — synced for your whole team.",
  },
  {
    title: "India Hosted & Secure",
    body: "Data stays on India-ready infrastructure with versioning and soft-delete protection.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 text-center sm:pt-20">
        <p className="text-sm font-medium uppercase tracking-wider text-[#ff6a00]">
          B2B SaaS for Indian teams
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
          Apna Business Cloud, India Me Safe
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
          Apni team ki files manage karo, 100% data Mumbai/Delhi me
        </p>
        <Link
          href="/login?mode=register"
          className="mt-8 inline-flex rounded-full bg-[#ff6a00] px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#e55f00]"
        >
          Start Free Trial
        </Link>
      </section>

      <section className="border-y border-gray-100 bg-gray-50/80">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm"
            >
              <h2 className="text-lg font-semibold text-gray-900">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20" id="pricing">
        <h2 className="text-center text-3xl font-semibold">Simple pricing</h2>
        <p className="mt-2 text-center text-gray-600">
          GST extra · Upgrade anytime from your dashboard
        </p>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <PricingCard
            name={SAAS_PLANS.starter.name}
            price={`₹${SAAS_PLANS.starter.priceInr}`}
            period="/mo"
            users={`${SAAS_PLANS.starter.maxUsers} Users`}
            storage={`${SAAS_PLANS.starter.storageGb}GB`}
            href="/login?mode=register"
          />
          <PricingCard
            name={SAAS_PLANS.growth.name}
            price={`₹${SAAS_PLANS.growth.priceInr}`}
            period="/mo"
            users={`${SAAS_PLANS.growth.maxUsers} Users`}
            storage={`${SAAS_PLANS.growth.storageGb}GB`}
            popular
            href="/login?mode=register"
          />
          <PricingCard
            name={SAAS_PLANS.enterprise.name}
            price="Contact"
            period=""
            users="Unlimited Users"
            storage="2TB+"
            href="mailto:sales@bharatcloud.store"
            external
          />
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} BharatCloud.store — Business cloud for India
      </footer>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  users,
  storage,
  popular,
  href,
  external,
}: {
  name: string;
  price: string;
  period: string;
  users: string;
  storage: string;
  popular?: boolean;
  href: string;
  external?: boolean;
}) {
  const inner = (
    <>
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#ff6a00] px-3 py-0.5 text-xs font-semibold text-white">
          Popular
        </span>
      )}
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-3 text-3xl font-bold text-gray-900">
        {price}
        {period && <span className="text-base font-normal text-gray-500">{period}</span>}
      </p>
      <ul className="mt-6 space-y-2 text-sm text-gray-600">
        <li>{users}</li>
        <li>{storage} storage</li>
      </ul>
      <span
        className={`mt-8 inline-block w-full rounded-full py-2.5 text-center text-sm font-semibold ${
          popular
            ? "bg-[#ff6a00] text-white"
            : "border border-gray-200 text-gray-800"
        }`}
      >
        {popular ? "Start Free Trial" : external ? "Contact" : "Get started"}
      </span>
    </>
  );

  const className = `relative rounded-2xl border p-8 text-center ${
    popular ? "border-[#ff6a00] shadow-lg shadow-orange-100" : "border-gray-200 bg-white"
  }`;

  if (external) {
    return (
      <a href={href} className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
