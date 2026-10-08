import Link from "next/link";

type Props = {
  variant?: "landing" | "minimal";
};

export function SiteHeader({ variant = "landing" }: Props) {
  return (
    <header className="border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: "#ff6a00" }}
          >
            BC
          </span>
          <span className="text-lg font-semibold tracking-tight text-gray-900">
            BharatCloud<span className="text-[#ff6a00]">.store</span>
          </span>
        </Link>
        {variant === "landing" && (
          <nav className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:border-[#ff6a00]/40 hover:text-[#ff6a00]"
            >
              Company Login
            </Link>
            <Link
              href="/b2b/super"
              className="rounded-full bg-[#ff6a00] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#e55f00]"
            >
              Super Admin Login
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
