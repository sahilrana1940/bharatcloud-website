const badges = [
  { emoji: "🇮🇳", label: "Made in India" },
  { emoji: "🔐", label: "AES-256 vault" },
  { emoji: "💳", label: "UPI & Razorpay" },
  { emoji: "☁️", label: "Google Drive OAuth" },
  { emoji: "📦", label: "Wasabi archive" },
];

export function TrustStrip() {
  return (
    <div className="mt-12 border-y border-slate-200/80 bg-white/70 py-6 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6">
        {badges.map((b) => (
          <span
            key={b.label}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
          >
            <span className="text-lg" aria-hidden>{b.emoji}</span>
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
