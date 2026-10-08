export type B2BPlanId = "500gb" | "1tb";

export const B2B_PLANS = {
  "500gb": {
    id: "500gb" as const,
    priceInr: 999,
    storageGb: 500,
    permanentIds: 5,
    label: "500GB Mumbai Vault + 5 Permanent IDs",
  },
  "1tb": {
    id: "1tb" as const,
    priceInr: 2199,
    storageGb: 1024,
    permanentIds: 10,
    label: "1TB Mumbai Vault + 10 Permanent IDs",
  },
};

export const EXTRA_ID_MONTHLY_INR = 99;
