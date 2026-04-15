"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useAuth } from "@/context/AuthContext";
import { getPlanById, PricingPlan } from "@/config/pricing";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Loader2, Lock } from "lucide-react";

// Initialise Stripe outside render to avoid re-creating on each render.
// Returns null gracefully when the publishable key is not set.
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ─── Inner payment form (must live inside <Elements>) ─────────────────────────
function PaymentForm({ plan }: { plan: PricingPlan }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/recruiter/purchase/success`,
      },
    });

    // confirmPayment only returns here if it fails (success redirects the user)
    if (stripeError) {
      setError(stripeError.message ?? "Payment failed. Please try again.");
    }
    setProcessing(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />

      {/* Inline error right above the pay button */}
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || processing}
      >
        {processing ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
        ) : (
          <><Lock className="mr-2 h-4 w-4" /> Pay {formatCurrency(plan.price, plan.currency)}</>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Secured by Stripe · Your card details are never stored on our servers
      </p>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const plan = getPlanById(planId);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const createIntent = useCallback(async () => {
    if (!user || !plan) return;
    try {
      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, recruiterId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialise payment");
      setClientSecret(data.clientSecret);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load payment form");
    }
  }, [user, plan]);

  useEffect(() => {
    if (!authLoading && user && plan) createIntent();
  }, [authLoading, user, plan, createIntent]);

  // Auth guard
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

  const stripeReady = !!stripePromise;

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
              30-day listing per credit
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
              Credits added instantly after payment
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Payment form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Gateway not configured */}
          {!stripeReady && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Payment gateway is being set up. Please check back soon or contact support.
            </div>
          )}

          {/* Loading intent */}
          {stripeReady && !clientSecret && !loadError && (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {/* Load error */}
          {loadError && (
            <div className="space-y-3">
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {loadError}
              </p>
              <Button variant="outline" className="w-full" onClick={createIntent}>
                Try again
              </Button>
            </div>
          )}

          {/* Stripe Elements form */}
          {stripeReady && clientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: "stripe" },
              }}
            >
              <PaymentForm
                plan={plan}

              />
            </Elements>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
