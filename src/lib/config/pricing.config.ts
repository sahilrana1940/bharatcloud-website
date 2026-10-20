// BharatCloud Pricing - 5999/24999/39999 yearly, inclusive, total storage
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
  { id: "100gb", name: "Starter", yearlyInr: 5999, storage: "100GB", storageLabel: "100GB Total Storage", maxIds: 5, label: "5 Users (Manual Approval)" },
  { id: "300gb", name: "Growth", yearlyInr: 24999, storage: "500GB", storageLabel: "500GB Total Storage", maxIds: 25, label: "25 Users (Auto)", badge: "MOST POPULAR" },
  { id: "1tb", name: "Enterprise", yearlyInr: 39999, storage: "2TB", storageLabel: "2TB Total Storage", maxIds: 0, label: "Unlimited (Auto)" },
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
  GROWTH: { price: 24999, storage: "500GB", maxIds: 25 },
  SCALE: { price: 39999, storage: "2TB", maxIds: 0 },
  PLANS: STORAGE_PLANS,
}