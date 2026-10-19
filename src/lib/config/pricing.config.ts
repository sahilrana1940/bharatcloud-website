export type StoragePlan = {
  id: string
  name: string
  yearlyInr: number
  storage: string
  maxIds: number
  label: string
  badge?: string
}

export const STORAGE_PLANS: StoragePlan[] = [
  { id: "starter", name: "Starter", yearlyInr: 5999, storage: "100GB", maxIds: 5, label: "5 IDs FIX", badge: "MOST POPULAR" },
  { id: "growth", name: "Growth", yearlyInr: 12999, storage: "300GB", maxIds: 20, label: "20 IDs MAX" },
  { id: "scale", name: "Scale", yearlyInr: 14999, storage: "1TB", maxIds: 50, label: "50 IDs MAX" },
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