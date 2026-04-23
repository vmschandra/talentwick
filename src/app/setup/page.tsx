"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Flame,
  CreditCard,
  Mail,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface HealthStatus {
  firebase: boolean;
  payments: { enabled: boolean; provider: string };
  email: { enabled: boolean; provider: string | null };
  timestamp: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  configured: boolean;
  required: boolean;
  icon: React.ReactNode;
  provider?: string | null;
  envVars: string[];
  docsUrl?: string;
}

export default function SetupPage() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchStatus() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) throw new Error("Health check failed");
      const data: HealthStatus = await res.json();
      setStatus(data);
    } catch {
      setError("Could not reach the health endpoint. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  const checklist: ChecklistItem[] = status
    ? [
        {
          id: "firebase",
          label: "Firebase",
          description:
            "Authentication, Firestore database, and file storage for your app.",
          configured: status.firebase,
          required: true,
          icon: <Flame className="h-5 w-5" />,
          envVars: [
            "NEXT_PUBLIC_FIREBASE_API_KEY",
            "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
            "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
            "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
            "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
            "NEXT_PUBLIC_FIREBASE_APP_ID",
          ],
          docsUrl: "https://console.firebase.google.com/",
        },
        {
          id: "payments",
          label: "Payments",
          description:
            "Credit-based job posting payments. Supports Cashfree, Razorpay, or PayPal.",
          configured: status.payments.enabled,
          required: false,
          icon: <CreditCard className="h-5 w-5" />,
          provider: status.payments.provider,
          envVars:
            status.payments.provider === "cashfree"
              ? [
                  "NEXT_PUBLIC_PAYMENT_PROVIDER=cashfree",
                  "CASHFREE_APP_ID",
                  "CASHFREE_SECRET_KEY",
                  "NEXT_PUBLIC_CASHFREE_ENV",
                ]
              : status.payments.provider === "razorpay"
              ? [
                  "NEXT_PUBLIC_PAYMENT_PROVIDER=razorpay",
                  "RAZORPAY_KEY_ID",
                  "RAZORPAY_KEY_SECRET",
                  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
                ]
              : [
                  "NEXT_PUBLIC_PAYMENT_PROVIDER=cashfree",
                  "CASHFREE_APP_ID",
                  "CASHFREE_SECRET_KEY",
                  "NEXT_PUBLIC_CASHFREE_ENV",
                ],
          docsUrl: "https://docs.cashfree.com/",
        },
        {
          id: "email",
          label: "Email Notifications",
          description:
            "Transactional emails for application updates. Supports Resend, SendGrid, or SMTP.",
          configured: status.email.enabled,
          required: false,
          icon: <Mail className="h-5 w-5" />,
          provider: status.email.provider,
          envVars: ["RESEND_API_KEY (or SENDGRID_API_KEY, or SMTP_HOST/PORT/USER/PASS)"],
          docsUrl: "https://resend.com/docs",
        },
      ]
    : [];

  const allRequiredConfigured =
    status !== null && checklist.filter((c) => c.required).every((c) => c.configured);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">TalentWick Setup</h1>
        <p className="mt-2 text-muted-foreground">
          Configure your environment to get TalentWick up and running.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-center text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchStatus} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {checklist.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      item.configured
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{item.label}</CardTitle>
                      {item.required ? (
                        <Badge variant="secondary" className="text-xs">
                          Required
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Optional
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {item.description}
                    </CardDescription>
                  </div>
                  <div className="shrink-0">
                    {item.configured ? (
                      <div className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        Configured
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                        <XCircle className="h-5 w-5" />
                        Missing
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              {!item.configured && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Add the following environment variables in your{" "}
                      <span className="font-medium text-foreground">
                        Vercel Dashboard
                      </span>{" "}
                      (Settings &rarr; Environment Variables) or your local{" "}
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                        .env.local
                      </code>{" "}
                      file:
                    </p>
                    <div className="rounded-md bg-muted p-3">
                      <code className="text-xs leading-relaxed">
                        {item.envVars.map((v, i) => (
                          <div key={i} className="font-mono">
                            {v}=your_value_here
                          </div>
                        ))}
                      </code>
                    </div>
                    {item.docsUrl && (
                      <a
                        href={item.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        View documentation
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              )}

              {item.configured && item.provider && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    Provider:{" "}
                    <span className="font-medium capitalize text-foreground">
                      {item.provider}
                    </span>
                  </p>
                </CardContent>
              )}
            </Card>
          ))}

          <Separator className="my-6" />

          {allRequiredConfigured ? (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold">
                    You&apos;re All Set!
                  </h2>
                  <p className="mt-1 text-muted-foreground">
                    All required services are configured. You can start using
                    TalentWick.
                  </p>
                </div>
                <Link href="/register">
                  <Button className="gap-2">
                    Create Your Account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <div className="text-center">
                  <h2 className="text-xl font-semibold">
                    Configuration Incomplete
                  </h2>
                  <p className="mt-1 text-muted-foreground">
                    Please configure the required services above before
                    continuing. After updating environment variables, redeploy
                    your app then refresh this page.
                  </p>
                </div>
                <Button variant="outline" onClick={fetchStatus} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Re-check Configuration
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
