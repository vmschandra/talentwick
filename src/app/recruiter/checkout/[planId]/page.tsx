"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getPlanById, PricingPlan } from "@/config/pricing";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Lock, Loader2, ShieldCheck, CreditCard } from "lucide-react";

function CheckoutForm({ plan, user }: { plan: PricingPlan; user: { uid: string; email: string | null } }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);

    try {
      // 1. Create Cashfree order on the server
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          recruiterId: user.uid,
          email: user.email ?? "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create payment session.");

      const { sessionId } = data;

      // 2. Load Cashfree JS SDK and launch checkout
      const { load } = await import("@cashfreepayments/cashfree-js");
      const cashfree = await load({
        mode: (process.env.NEXT_PUBLIC_CASHFREE_ENV === "production" ? "production" : "sandbox") as "sandbox" | "production",
      });

      await cashfree.checkout({
        paymentSessionId: sessionId,
        redirectTarget: "_self",
      });

      // After this point the browser navigates away to Cashfree's payment page.
      // Control returns to /recruiter/purchase/success via the return_url.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment initiation failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Trust badges */}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border bg-muted/40 p-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> SSL Secured
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5 text-primary" /> Cards, UPI, Net Banking
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 text-primary" /> PCI DSS Compliant
        </span>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={handlePay}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting to Cashfree…
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" /> Pay {formatCurrency(plan.price, plan.currency)} Securely
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        You&apos;ll be redirected to Cashfree&apos;s secure payment page.
        Credits are added to your account instantly after payment.
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const plan = getPlanById(planId);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login?role=recruiter");
  }, [authLoading, user, router]);

  if (!plan) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Plan not found.</p>
          <Link href="/recruiter/pricing" className="text-primary hover:underline text-sm">
            ← Back to pricing
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading || !user) return null;

  const pricePerCredit = plan.price / plan.credits;

  return (
    <div className="mx-auto max-w-lg py-8 px-4 space-y-6">
      {/* Back link */}
      <Link
        href="/recruiter/pricing"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to pricing
      </Link>

      {/* Order summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Order Summary</CardTitle>
            {plan.popular && <Badge>Most Popular</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">{plan.name} Plan</span>
            <span className="font-bold text-lg">{formatCurrency(plan.price, plan.currency)}</span>
          </div>
          <Separator />
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
              {plan.credits} job posting credit{plan.credits !== 1 ? "s" : ""}
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
              {formatCurrency(pricePerCredit, plan.currency)} per post
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
              30-day listing per credit
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
              Credits added instantly after payment
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Cashfree payment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Secure Payment via Cashfree
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CheckoutForm plan={plan} user={{ uid: user.uid, email: user.email }} />
        </CardContent>
      </Card>
    </div>
  );
}
