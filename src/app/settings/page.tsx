import { SettingsIntegrations } from "@/components/settings/SettingsIntegrations";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-transparent px-4 py-8 sm:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
      <p className="mt-2 text-slate-500">Account integrations and backup connections</p>
      <div className="mt-8 max-w-3xl">
        <SettingsIntegrations />
      </div>
    </div>
  );
}
