"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getRecruiterTransactions } from "@/lib/firebase/firestore";
import { Transaction } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, CreditCard, CheckCircle2, XCircle, Clock, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: "text-green-700 bg-green-100 border-green-200",
  },
  pending: {
    label: "Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
    className: "text-amber-700 bg-amber-100 border-amber-200",
  },
  failed: {
    label: "Failed",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: "text-red-700 bg-red-100 border-red-200",
  },
  refunded: {
    label: "Refunded",
    icon: <RefreshCcw className="h-3.5 w-3.5" />,
    className: "text-blue-700 bg-blue-100 border-blue-200",
  },
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

function formatDate(ts: { toDate: () => Date } | null | undefined): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getRecruiterTransactions(user.uid)
      .then(setTransactions)
      .catch(() => toast.error("Failed to load transactions. Please refresh."))
      .finally(() => setLoading(false));
  }, [user]);

  const totalSpent = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCredits = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.credits, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transaction History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All credit purchases made on your account
        </p>
      </div>

      {/* Summary cards */}
      {!loading && transactions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Receipt className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Transactions</p>
                <p className="text-xl font-bold">{transactions.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Credits Purchased</p>
                <p className="text-xl font-bold">{totalCredits}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-xl font-bold">
                  {formatCurrency(totalSpent, transactions[0]?.currency || "inr")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Transactions</CardTitle>
          <CardDescription>A full record of every credit purchase</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-0 divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Receipt className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground">
                Your payment history will appear here after your first purchase.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((t) => {
                const status = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.pending;
                return (
                  <div
                    key={t.id}
                    className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:gap-4"
                  >
                    {/* Icon */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <CreditCard className="h-4 w-4" />
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {PLAN_LABELS[t.plan] ?? t.plan} Plan —{" "}
                        {t.credits} credit{t.credits !== 1 ? "s" : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(t.createdAt as any)}
                        {t.gatewayTransactionId && (
                          <span className="ml-2 font-mono opacity-60">
                            #{t.gatewayTransactionId.toString().slice(0, 12)}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Amount */}
                    <p className="text-sm font-semibold">
                      {formatCurrency(t.amount, t.currency)}
                    </p>

                    {/* Status badge */}
                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1 ${status.className}`}
                    >
                      {status.icon}
                      {status.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
