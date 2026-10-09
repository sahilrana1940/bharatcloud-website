import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 px-6 py-16 text-slate-100">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-semibold">Secure checkout</h1>
        <p className="mt-2 text-sm text-slate-400">BharatCloud.store · Test mode</p>
      </div>
      <div className="mx-auto mt-10 max-w-lg text-slate-900 dark:text-slate-100">
        <CheckoutClient />
      </div>
    </div>
  );
}
