export interface PricingPlan {
  id: "starter" | "growth" | "enterprise";
  name: string;
  price: number;       // in cents
  credits: number;
  currency: string;
  description: string;
  popular?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 1000,
    credits: 1,
    currency: "usd",
    description: "Perfect for trying out the platform with a single job post.",
  },
  {
    id: "growth",
    name: "Growth",
    price: 2000,
    credits: 3,
    currency: "usd",
    description: "Best value for growing teams. Save 33% per post.",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 5000,
    credits: 10,
    currency: "usd",
    description: "For high-volume hiring. Save 50% per post.",
  },
];

export function getPlanById(id: string): PricingPlan | undefined {
  return pricingPlans.find((p) => p.id === id);
}
