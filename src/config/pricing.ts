export interface PricingPlan {
  id: "starter" | "growth" | "enterprise";
  name: string;
  price: number;       // in paise (smallest INR unit; divide by 100 for display)
  credits: number;
  currency: string;
  description: string;
  popular?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 99900,        // ₹999
    credits: 1,
    currency: "inr",
    description: "Perfect for trying out the platform with a single job post.",
  },
  {
    id: "growth",
    name: "Growth",
    price: 249900,       // ₹2,499
    credits: 3,
    currency: "inr",
    description: "Best value for growing teams. Save 17% per post.",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 499900,       // ₹4,999
    credits: 10,
    currency: "inr",
    description: "For high-volume hiring. Save 50% per post.",
  },
];

export function getPlanById(id: string): PricingPlan | undefined {
  return pricingPlans.find((p) => p.id === id);
}
