export type StoragePlan = {
  id: string
  name: string
  yearlyInr: number
  storage: string
  storageLabel: string
  maxIds: number
  label: string
  badge?: string
}

export const STORAGE_PLANS: StoragePlan[] = [
  { id: "100gb", name: "100GB FIX", yearlyInr: 5999, storage: "100GB", storageLabel: "100GB FIX", maxIds: 5, label: "5 IDs FIX", badge: "MOST POPULAR" },
  { id: "300gb", name: "300GB MAX", yearlyInr: 12999, storage: "300GB", storageLabel: "300GB MAX", maxIds: 20, label: "20 IDs MAX" },
  { id: "1tb", name: "1TB MAX", yearlyInr: 14999, storage: "1TB", storageLabel: "1TB MAX", maxIds: 50, label: "50 IDs MAX" },
]

export function formatInr(n?: number): string {
  if (typeof n !== "number") return "Rs. 0"
  return "Rs. " + n.toLocaleString("en-IN")
}

export const PRICING_PLANS = STORAGE_PLANS
export const PRICING_CONFIG = {
  STARTER: { price: 5999, storage: "100GB", maxIds: 5 },
  GROWTH: { price: 12999, storage: "300GB", maxIds: 20 },
  SCALE: { price: 14999, storage: "1TB", maxIds: 50 },
}