import { HardDrive, Lock, MapPin, Shield } from "lucide-react";

const items = [
  { icon: Shield, text: "Encrypted vault + archive" },
  { icon: MapPin, text: "India-first storage (Mumbai region)" },
  { icon: HardDrive, text: "Google Drive auto-backup after payment" },
  { icon: Lock, text: "7-year B2B retention ready" },
];

export function BackupValueStrip() {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {items.map(({ icon: Icon, text }) => (
        <div
          key={text}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
        >
          <Icon className="h-4 w-4 shrink-0 text-cyan-600" />
          {text}
        </div>
      ))}
    </div>
  );
}
