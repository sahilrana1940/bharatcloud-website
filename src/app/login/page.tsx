import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/50 p-8">
        <h1 className="text-xl font-semibold">BharatCloud login</h1>
        <p className="mt-2 text-sm text-slate-400">
          Web login for view and download. New uploads use the mobile app only.
        </p>
        <p className="mt-6 text-sm text-slate-500">OTP login — wire to MSG91 backend.</p>
        <Link href="/gallery" className="mt-6 inline-block text-sm text-sky-400 hover:text-sky-300">
          Continue to gallery (demo) →
        </Link>
      </div>
    </div>
  );
}
