"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { pricingPlans } from "@/config/pricing";

interface HealthStatus {
  firebase: boolean;
  payments: { enabled: boolean; provider: string };
  email: { enabled: boolean; provider: string | null };
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  // Manual credit form
  const [recruiterId, setRecruiterId] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {})
      .finally(() => setLoadingHealth(false));
  }, []);

  const handleAddCredits = async () => {
    if (!recruiterId.trim()) {
      toast.error("Enter a recruiter user ID");
      return;
    }
    const plan = pricingPlans.find((p) => p.id === selectedPlan);
    if (!plan) {
      toast.error("Select a plan");
      return;
    }

    setSubmitting(true);
    try {
      const idToken = await user?.getIdToken();
      const res = await fetch("/api/payments/manual-credit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          recruiterId: recruiterId.trim(),
          credits: plan.credits,
          plan: plan.id,
          amount: plan.price,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Added ${plan.credits} credit(s) to recruiter.`);
      setRecruiterId("");
      setSelectedPlan("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add credits");
    } finally {
      setSubmitting(false);
    }
  };

  const StatusBadge = ({ ok }: { ok: boolean }) =>
    ok ? (
      <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Connected</Badge>
    ) : (
      <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Not Configured</Badge>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Config Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>Current configuration of external services</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHealth ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking...
            </div>
          ) : health ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <p className="font-medium">Firebase</p>
                  <p className="text-sm text-muted-foreground">Authentication, Database, Storage</p>
                </div>
                <StatusBadge ok={health.firebase} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <p className="font-medium">Payments</p>
                  <p className="text-sm text-muted-foreground">
                    Provider: <span className="capitalize">{health.payments.provider}</span>
                  </p>
                </div>
                <StatusBadge ok={health.payments.enabled} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    Provider: {health.email.provider || "Console (fallback)"}
                  </p>
                </div>
                <StatusBadge ok={health.email.enabled} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Failed to check status.</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Manual Credit Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Add Credits Manually
          </CardTitle>
          <CardDescription>
            Add job posting credits to a recruiter&apos;s account. Use this when payment is received outside the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recruiterId">Recruiter User ID</Label>
            <Input
              id="recruiterId"
              placeholder="Enter the recruiter's Firebase UID"
              value={recruiterId}
              onChange={(e) => setRecruiterId(e.target.value)}
            />
          </div>
          <div>
            <Label>Plan</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
              <SelectContent>
                {pricingPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} — {plan.credits} credit{plan.credits > 1 ? "s" : ""} (${(plan.price / 100).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddCredits} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Credits
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
