import { AuthMarketingPanel } from "@/components/auth/AuthMarketingPanel";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <AuthMarketingPanel />
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-2xl shadow-slate-200/50">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600">Sign in</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Welcome back</h1>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
