import Link from "next/link";

const NAV = [
  { href: "/#features", label: "Features", id: "features" },
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
    <div className="relative min-h-screen bg-[#050508] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,107,0,0.35)_1px,_transparent_0)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(59,130,246,0.28)_1px,_transparent_0)] bg-[size:40px_40px] [background-position:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-orange-900/20" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050508]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2 text-lg font-bold text-white sm:text-2xl">
            <span className="text-2xl sm:text-3xl" aria-hidden>
              ☁️
            </span>
            <span className="truncate">
              BharatCloud<span className="text-orange-500">.store</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-gray-400 md:flex">
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
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border border-white/20 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 sm:px-5 sm:text-sm"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-2 text-xs font-bold text-white sm:px-5 sm:text-sm"
            >
              Sign Up
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-2 px-4 pb-3 text-sm text-gray-400 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={item.id === active ? "font-semibold text-orange-400" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 md:py-16">{children}</div>
    </div>
  );
}
