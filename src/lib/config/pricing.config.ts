// BharatCloud Pricing - 5999/12999/14999 - 5/20/50 IDs
export type StoragePlanId = "100gb" | "300gb" | "1tb";

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
  { id: "100gb", name: "100GB FIX", yearlyInr: 5999, storage: "100GB", storageLabel: "100GB FIX", maxIds: 5, label: "5 IDs FIX" },
  { id: "300gb", name: "300GB MAX", yearlyInr: 12999, storage: "300GB", storageLabel: "300GB MAX", maxIds: 20, label: "20 IDs MAX", badge: "Popular" },
  { id: "1tb", name: "1TB MAX", yearlyInr: 14999, storage: "1TB", storageLabel: "1TB MAX", maxIds: 50, label: "50 IDs MAX" },
]

export function formatInr(n?: number): string {
  if (typeof n !== "number") return "Rs. 0"
  return "Rs. " + n.toLocaleString("en-IN")
}

// DashboardConsole ye 2 function maang raha hai
export function isIdCapReached(current: number, max: number): boolean {
  return current >= max
}

export function planById(id: string): StoragePlan | undefined {
  return STORAGE_PLANS.find(p => p.id === id)
}

// Extra aliases - kabhi bhi kisi file ne maanga toh error na aaye
export const PRICING_PLANS = STORAGE_PLANS
export const PLANS = STORAGE_PLANS
export const PRICING_CONFIG = {
  STARTER: { price: 5999, storage: "100GB", maxIds: 5 },
  GROWTH: { price: 12999, storage: "300GB", maxIds: 20 },
  SCALE: { price: 14999, storage: "1TB", maxIds: 50 },
  PLANS: STORAGE_PLANS,
}