"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getRecruiterCredits } from "@/lib/payments/credit-service";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  CreditCard,
  PlusCircle,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";

function SuccessContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    async function verifyAndLoad() {
      try {
        // Verify the order with Cashfree and add credits if not already done
        const orderId = searchParams.get("order_id");
        if (orderId) {
          const idToken = await user!.getIdToken();
          await fetch("/api/payments/verify-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({ orderId }),
          });
        }

        // Fetch updated credit balance
        const c = await getRecruiterCredits(user!.uid);
        setCredits(c);
      } catch {
        toast.error("Failed to load credit balance. Please refresh.");
      } finally {
        setLoading(false);
      }
    }

    verifyAndLoad();
  }, [user, authLoading, searchParams]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="space-y-6 p-10 text-center">
            <Skeleton className="mx-auto h-20 w-20 rounded-full" />
            <Skeleton className="mx-auto h-8 w-64" />
            <Skeleton className="mx-auto h-5 w-80" />
            <Skeleton className="mx-auto h-24 w-48" />
            <div className="flex justify-center gap-3">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-36" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardContent className="space-y-6 p-10 text-center">
          <div className="relative mx-auto w-fit">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <Sparkles className="absolute -right-2 -top-2 h-6 w-6 text-yellow-500" />
            <Sparkles className="absolute -bottom-1 -left-3 h-5 w-5 text-yellow-400" />
            <Sparkles className="absolute -right-4 bottom-2 h-4 w-4 text-yellow-300" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Your credits have been added to your account. You&apos;re ready to post jobs!
            </p>
          </div>

          {credits !== null && (
            <div className="mx-auto inline-flex items-center gap-3 rounded-xl border bg-muted/50 px-6 py-4">
              <CreditCard className="h-6 w-6 text-primary" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Current Balance</p>
                <p className="text-3xl font-bold">{credits}</p>
                <p className="text-xs text-muted-foreground">
                  credit{credits !== 1 ? "s" : ""} available
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/recruiter/post-job">
                <PlusCircle className="mr-2 h-4 w-4" /> Post a Job
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/recruiter/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
