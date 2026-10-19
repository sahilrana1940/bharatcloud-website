"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function ProMeshBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none fixed inset-0 pro-mesh", className)}
      aria-hidden
    />
  );
}

export function GlassPanel({
  className,
  children,
  hover = false,
}: {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
}) {
  const base = cn("pro-glass rounded-2xl", className);
  if (!hover) return <div className={base}>{children}</div>;
  return (
    <motion.div whileHover={{ y: -2 }} className={base}>
      {children}
    </motion.div>
  );
}

export function ProPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0F766E]">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}

export function ProStatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <GlassPanel hover className="p-5">
      <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </GlassPanel>
  );
}

export function ProPrimaryButton({
  href,
  onClick,
  children,
  className,
  type = "button",
  disabled,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-cyan-500 to-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-105 disabled:opacity-50",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function ProGhostButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function ProTableWrap({ children }: { children: React.ReactNode }) {
  return (
    <GlassPanel className="overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </GlassPanel>
  );
}
