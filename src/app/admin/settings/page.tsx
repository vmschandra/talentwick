"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getAllUsers, getAllJobs, getAllCandidateProfiles } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, CreditCard, Loader2, Users, Briefcase, UserCheck, Building2 } from "lucide-react";
import { toast } from "sonner";
import { pricingPlans } from "@/config/pricing";
import { UserDoc } from "@/types";

interface HealthStatus {
  firebase: boolean;
  payments: { enabled: boolean; provider: string };
  email: { enabled: boolean; provider: string | null };
}

interface PlatformStats {
  totalUsers: number;
  candidates: number;
  recruiters: number;
  activeJobs: number;
  totalProfiles: number;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Manual credit form
  const [recruiterIdOrEmail, setRecruiterIdOrEmail] = useState("");
  const [resolvedUid, setResolvedUid] = useState<string | null>(null);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) =>
      fetch("/api/health", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then(setHealth)
        .catch(() => {})
        .finally(() => setLoadingHealth(false))
    );
  }, [user]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [users, jobs, profiles] = await Promise.all([
          getAllUsers(500),
          getAllJobs(500),
          getAllCandidateProfiles(),
        ]);
        const typedUsers = users as UserDoc[];
        setStats({
          totalUsers: typedUsers.length,
          candidates: typedUsers.filter((u) => u.role === "candidate").length,
          recruiters: typedUsers.filter((u) => u.role === "recruiter").length,
          activeJobs: (jobs).filter((j) => j.status === "active").length,
          totalProfiles: profiles.length,
        });
      } catch {
        // non-critical
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, []);

  // Resolve recruiter by email or UID
  const handleResolve = async () => {
    const val = recruiterIdOrEmail.trim();
    if (!val) return;

    // If it looks like a UID (no @ symbol), use directly
    if (!val.includes("@")) {
      setResolvedUid(val);
      setResolvedName(null);
      return;
    }

    setResolving(true);
    try {
      const users = await getAllUsers(500) as UserDoc[];
      const match = users.find(
        (u) => u.email === val && u.role === "recruiter"
      );
      if (!match) {
        toast.error("No recruiter found with that email");
        setResolvedUid(null);
        setResolvedName(null);
      } else {
        setResolvedUid(match.uid);
        setResolvedName(match.displayName);
        toast.success(`Found: ${match.displayName} (${match.uid.slice(0, 8)}…)`);
      }
    } catch {
      toast.error("Failed to look up user");
    } finally {
      setResolving(false);
    }
  };

  const handleAddCredits = async () => {
    const uid = resolvedUid ?? (recruiterIdOrEmail.includes("@") ? null : recruiterIdOrEmail.trim());
    if (!uid) {
      toast.error("Resolve a recruiter first");
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
          recruiterId: uid,
          credits: plan.credits,
          plan: plan.id,
          amount: plan.price,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Added ${plan.credits} credit(s) to ${resolvedName ?? "recruiter"}.`);
      setRecruiterIdOrEmail("");
      setResolvedUid(null);
      setResolvedName(null);
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

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users },
    { label: "Candidates", value: stats?.candidates, icon: UserCheck },
    { label: "Recruiters", value: stats?.recruiters, icon: Building2 },
    { label: "Active Jobs", value: stats?.activeJobs, icon: Briefcase },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Platform Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                {loadingStats ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-xl font-bold">{value ?? "—"}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

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
            Add job posting credits to a recruiter&apos;s account. Look up by email or paste a Firebase UID directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recruiter lookup */}
          <div>
            <Label htmlFor="recruiterLookup">Recruiter Email or UID</Label>
            <div className="mt-1 flex gap-2">
              <Input
                id="recruiterLookup"
                placeholder="recruiter@company.com or Firebase UID"
                value={recruiterIdOrEmail}
                onChange={(e) => {
                  setRecruiterIdOrEmail(e.target.value);
                  setResolvedUid(null);
                  setResolvedName(null);
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleResolve}
                disabled={resolving || !recruiterIdOrEmail.trim()}
              >
                {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look up"}
              </Button>
            </div>
            {resolvedName && (
              <p className="mt-1 text-xs text-green-600 font-medium">
                ✓ {resolvedName} — {resolvedUid?.slice(0, 12)}…
              </p>
            )}
            {resolvedUid && !resolvedName && !recruiterIdOrEmail.includes("@") && (
              <p className="mt-1 text-xs text-muted-foreground">UID set directly.</p>
            )}
          </div>

          {/* Plan */}
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

          <Button
            onClick={handleAddCredits}
            disabled={submitting || (!resolvedUid && recruiterIdOrEmail.includes("@"))}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Credits
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
