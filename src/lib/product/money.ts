export const PARTNER_PLAN = {
  name: "Starter",
  code: "starter",
  pricePaise: 699900,
  ids: 5,
  gb: 100,
  label: "₹6,999 / Year",
};

export const PARTNER_PRODUCTS = [
  PARTNER_PLAN,
  { code: "pro", name: "Pro", pricePaise: 1999900, ids: 25, gb: 500, label: "₹19,999 / Year" },
] as const;

export function productForQuota(ids: number, gb: number) {
  return PARTNER_PRODUCTS.find((product) => product.ids === ids && product.gb === gb) ?? null;
}

export function rupee(paise: number) {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  const hasPaisa = abs % 100 !== 0;
  const formatted = (abs / 100).toLocaleString("en-IN", {
    minimumFractionDigits: hasPaisa ? 2 : 0,
    maximumFractionDigits: hasPaisa ? 2 : 0,
  });
  return `${sign}₹${formatted}`;
}

export function rupeesToPaise(value: number) {
  return Math.round(value * 100);
}

export function planLabel(cycle: string, yearlyPaise: number, monthlyPaise: number) {
  const yearly = `${rupee(yearlyPaise)} / Year`;
  const monthly = `${rupee(monthlyPaise)} / Month`;
  if (cycle === "monthly") return monthly;
  if (cycle === "both") return `${monthly} ya ${yearly}`;
  return yearly;
}

export const GB = 1024 * 1024 * 1024;

export function bytesLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < GB) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / GB).toFixed(2)} GB`;
}
