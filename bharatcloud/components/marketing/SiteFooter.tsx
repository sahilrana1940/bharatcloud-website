import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">BharatCloud.store</p>
            <p className="mt-1 text-sm text-slate-600">Secure cloud storage for teams in India.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <Link href="/pricing" className="hover:text-slate-900">
              Pricing
            </Link>
            <Link href="/features" className="hover:text-slate-900">
              Features
            </Link>
            <a href="mailto:sales@bharatcloud.store" className="hover:text-slate-900">
              Contact Sales
            </a>
          </div>
        </div>
        <p className="mt-8 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-xs font-medium text-slate-700 shadow-sm sm:text-sm">
          ISO 27001 Certified • SOC 2 Compliant • GDPR Compliant
        </p>
        <p className="mt-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} BharatCloud. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
