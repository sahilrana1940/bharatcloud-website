"use client";

import { motion } from "framer-motion";
import { Cloud, HardDrive, Shield, Users } from "lucide-react";

export function HeroProductPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="relative mx-auto w-full max-w-lg lg:max-w-none"
    >
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-orange-400/20 via-cyan-400/25 to-emerald-400/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-300/40">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-cyan-50/50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs font-medium text-slate-500">BharatCloud workspace</span>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <PreviewCard
            icon={<Users className="h-5 w-5 text-orange-500" />}
            label="Team"
            value="12 members"
            gradient="from-orange-50 to-amber-50"
            border="border-orange-100"
          />
          <PreviewCard
            icon={<HardDrive className="h-5 w-5 text-cyan-600" />}
            label="Drive backup"
            value="84% synced"
            gradient="from-cyan-50 to-sky-50"
            border="border-cyan-100"
          />
          <PreviewCard
            icon={<Shield className="h-5 w-5 text-emerald-600" />}
            label="Vault"
            value="Encrypted"
            gradient="from-emerald-50 to-teal-50"
            border="border-emerald-100"
          />
          <PreviewCard
            icon={<Cloud className="h-5 w-5 text-indigo-500" />}
            label="Archive"
            value="Wasabi S3"
            gradient="from-indigo-50 to-violet-50"
            border="border-indigo-100"
          />
        </div>

        <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">Last backup</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
              Running · 200 OK
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-orange-400 via-cyan-500 to-emerald-500"
              initial={{ width: "0%" }}
              animate={{ width: "72%" }}
              transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute -right-2 top-8 hidden rounded-xl border border-orange-200 bg-white px-3 py-2 shadow-lg sm:block"
      >
        <p className="text-[10px] font-bold uppercase tracking-wide text-orange-600">UPI ready</p>
        <p className="text-sm font-bold text-slate-800">₹999/mo</p>
      </motion.div>
    </motion.div>
  );
}

function PreviewCard({
  icon,
  label,
  value,
  gradient,
  border,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
  border: string;
}) {
  return (
    <div className={`rounded-xl border ${border} bg-gradient-to-br ${gradient} p-3`}>
      <div className="flex items-center gap-2">{icon}</div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}
