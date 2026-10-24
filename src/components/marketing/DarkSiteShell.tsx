import Link from "next/link";

const NAV = [
  { href: "/features", label: "Features", id: "features" },
  { href: "/security", label: "Security", id: "security" },
  { href: "/", label: "Pricing", id: "pricing" },
  { href: "/contact", label: "Contact", id: "contact" },
] as const;

export function DarkSiteShell({
  active,
  children,
}: {
  active: (typeof NAV)[number]["id"];
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050508] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,107,0,0.35)_1px,_transparent_0)] bg-[size:40px_40px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(59,130,246,0.28)_1px,_transparent_0)] bg-[size:40px_40px] [background-position:20px_20px]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-orange-900/20" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 md:py-16">
        <nav className="mb-16 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
              <span className="text-3xl" aria-hidden>
                ☁️
              </span>
              BharatCloud<span className="text-orange-500">.store</span>
            </Link>
            <div className="hidden items-center gap-8 text-gray-400 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={
                    item.id === active
                      ? "border-b-2 border-orange-400 pb-1 text-orange-400"
                      : "hover:text-white"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2 text-sm font-bold text-white sm:px-6"
            >
              Get Started
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-400 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={item.id === active ? "font-semibold text-orange-400" : ""}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        {children}
      </div>
    </div>
  );
}
