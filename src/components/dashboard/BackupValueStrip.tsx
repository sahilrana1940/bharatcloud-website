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
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#1E2639]/60 px-4 py-3 text-sm text-slate-300"
        >
          <Icon className="h-4 w-4 shrink-0 text-cyan-400" />
          {text}
        </div>
      ))}
    </div>
  );
}
