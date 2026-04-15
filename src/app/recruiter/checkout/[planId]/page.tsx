"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getPlanById, PricingPlan } from "@/config/pricing";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, CreditCard, Lock, Loader2, FlaskConical } from "lucide-react";

// ─── Card number formatter ─────────────────────────────────────────────────────
function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

// ─── Payment form ──────────────────────────────────────────────────────────────
function PaymentForm({ plan, recruiterId }: { plan: PricingPlan; recruiterId: string }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!name.trim()) return "Cardholder name is required.";
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 13) return "Enter a valid card number.";
    if (expiry.length < 5) return "Enter a valid expiry date (MM/YY).";
    const [mm, yy] = expiry.split("/").map(Number);
    if (!mm || mm < 1 || mm > 12) return "Invalid expiry month.";
    const now = new Date();
    const expDate = new Date(2000 + yy, mm - 1, 1);
    if (expDate < new Date(now.getFullYear(), now.getMonth(), 1)) return "Card has expired.";
    if (cvc.length < 3) return "Enter a valid CVC.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setProcessing(true);
    setError(null);

    // Simulate a brief processing delay for realism
    await new Promise((res) => setTimeout(res, 1500));

    try {
      const cardLast4 = cardNumber.replace(/\s/g, "").slice(-4);
      const res = await fetch("/api/payments/test-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, recruiterId, cardLast4 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purchase failed");
      router.push("/recruiter/purchase/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed. Please try again.");
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Test mode banner */}
      <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <FlaskConical className="h-3.5 w-3.5 shrink-0" />
        <span>
          <strong>Test mode</strong> — no real charge will occur. Use any card details.
        </span>
      </div>

      {/* Cardholder name */}
      <div className="space-y-1.5">
        <Label htmlFor="card-name">Cardholder name</Label>
        <Input
          id="card-name"
          placeholder="Jane Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="cc-name"
          disabled={processing}
        />
      </div>

      {/* Card number */}
      <div className="space-y-1.5">
        <Label htmlFor="card-number">Card number</Label>
        <div className="relative">
          <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="card-number"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className="pl-9"
            inputMode="numeric"
            autoComplete="cc-number"
            disabled={processing}
          />
        </div>
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="expiry">Expiry</Label>
          <Input
            id="expiry"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            inputMode="numeric"
            autoComplete="cc-exp"
            disabled={processing}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cvc">CVC</Label>
          <Input
            id="cvc"
            placeholder="123"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            autoComplete="cc-csc"
            disabled={processing}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={processing}>
        {processing ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
        ) : (
          <><Lock className="mr-2 h-4 w-4" /> Pay {formatCurrency(plan.price, plan.currency)}</>
        )}
      </Button>
    </form>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
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
          <PaymentForm plan={plan} recruiterId={user.uid} />
        </CardContent>
      </Card>
    </div>
  );
}
