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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#22D3EE]">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-white/55">{description}</p>}
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
      <div className="mb-2 flex items-center gap-2 text-sm text-white/55">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/45">{hint}</p>}
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
    "inline-flex items-center justify-center gap-2 rounded-xl bg-[#22D3EE] px-6 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-300 disabled:opacity-50",
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
        "inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-[#22D3EE]/40 hover:bg-white/[0.08]",
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
