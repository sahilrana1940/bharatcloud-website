import Link from "next/link";

import { BRAND_PARENT, BRAND_PRODUCT } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Props = {
  href?: string;
  className?: string;
  /** Tailwind class for the “by …” line */
  accentClass?: string;
  /** Primary line text color */
  titleClass?: string;
};

export function BrandMark({
  href = "/",
  className,
  accentClass = "text-cyan-400",
  titleClass = "text-slate-100",
}: Props) {
  return (
    <Link href={href} className={cn("flex flex-col leading-tight", className)}>
      <span className={cn("text-sm font-semibold tracking-tight", titleClass)}>
        {BRAND_PRODUCT}
      </span>
      <span
        className={cn(
          "text-[10px] font-medium uppercase tracking-wider",
          accentClass,
        )}
      >
        by {BRAND_PARENT}
      </span>
    </Link>
  );
}
