"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getRecruiterCredits } from "@/lib/payments/credit-service";
import { getPaymentProviderName } from "@/lib/payments/registry";
import { pricingPlans, PricingPlan } from "@/config/pricing";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Check,
  Loader2,
  Zap,
} from "lucide-react";

export default function PricingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [purchasingPlan, setPurchasingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchCredits() {
      try {
        const c = await getRecruiterCredits(user!.uid);
        setCredits(c);
      } catch {
        toast.error("Failed to load your credit balance.");
      } finally {
        setLoading(false);
      }
    }

    fetchCredits();
  }, [user, authLoading]);

  function handlePurchase(plan: PricingPlan) {
    if (!user) return;
    setPurchasingPlan(plan.id);
    router.push(`/recruiter/checkout/${plan.id}`);
  }

  if (authLoading || loading) {
    return <PricingSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Buy Job Post Credits</h1>
        <p className="mt-2 text-muted-foreground">
          Each credit lets you post one job for 30 days
        </p>
      </div>

      {/* Current Balance */}
      <Card className="mx-auto max-w-md">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold">{credits} credit{credits !== 1 ? "s" : ""}</p>
            </div>
          </div>
          {credits < 2 && (
            <Badge variant="warning">Running low</Badge>
          )}
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-3">
        {pricingPlans.map((plan) => {
          const pricePerCredit = plan.price / plan.credits;
          const isPurchasing = purchasingPlan === plan.id;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col",
                plan.popular && "border-primary shadow-md"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="px-3 py-1">
                    <Zap className="mr-1 h-3 w-3" /> Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className={cn("text-center", plan.popular && "pt-8")}>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4 text-center">
                <div>
                  <span className="text-4xl font-bold">
                    {formatCurrency(plan.price, plan.currency)}
                  </span>
                </div>

                <Separator />

                <ul className="space-y-2 text-left text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      <strong>{plan.credits}</strong> job posting credit{plan.credits !== 1 ? "s" : ""}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>
                      {formatCurrency(pricePerCredit, plan.currency)} per post
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>30-day listing per credit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Full applicant management</span>
                  </li>
                  {plan.credits >= 3 && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Priority support</span>
                    </li>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isPurchasing}
                  onClick={() => handlePurchase(plan)}
                >
                  {isPurchasing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <>Buy Now</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Payment Provider Info */}
      {getPaymentProviderName() !== "manual" && (
        <p className="text-center text-xs text-muted-foreground">
          Secure payments via {getPaymentProviderName()}. Credits are added instantly after payment.
        </p>
      )}
    </div>
  );
}

function PricingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-9 w-72" />
        <Skeleton className="mx-auto h-5 w-56" />
      </div>
      <Skeleton className="mx-auto h-24 w-full max-w-md" />
      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-96 w-full" />
        ))}
      </div>
    </div>
  );
}
