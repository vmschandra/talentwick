"use client";

import { useEffect, useState } from "react";
import { getAllTransactions } from "@/lib/firebase/firestore";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StatsCard from "@/components/cards/StatsCard";
import { DollarSign, CreditCard, TrendingUp, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TransactionRow {
  id: string;
  recruiterId?: string;
  gateway?: string;
  plan?: string;
  amount?: number;
  credits?: number;
  currency?: string;
  status?: string;
  createdAt?: { toDate: () => Date };
}

export default function AdminRevenuePage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllTransactions()
      .then((data) => setTransactions(data as TransactionRow[]))
      .catch(() => toast.error("Failed to load revenue data. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const completed = transactions.filter((t) => t.status === "completed");
  const totalRevenue = completed.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalCredits = completed.reduce((sum, t) => sum + (t.credits || 0), 0);

  const byGateway: Record<string, number> = {};
  completed.forEach((t) => {
    const gw = t.gateway || "unknown";
    byGateway[gw] = (byGateway[gw] || 0) + (t.amount || 0);
  });

  const byPlan: Record<string, number> = {};
  completed.forEach((t) => {
    const plan = t.plan || "unknown";
    byPlan[plan] = (byPlan[plan] || 0) + 1;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Revenue Analytics</h1>
        <div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Revenue Analytics</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={<DollarSign className="h-5 w-5" />} />
        <StatsCard title="Total Credits Sold" value={totalCredits} icon={<CreditCard className="h-5 w-5" />} />
        <StatsCard title="Transactions" value={completed.length} icon={<Receipt className="h-5 w-5" />} />
        <StatsCard title="Avg Order" value={completed.length > 0 ? formatCurrency(Math.round(totalRevenue / completed.length)) : "$0"} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Revenue by Gateway</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(byGateway).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(byGateway).map(([gw, amt]) => (
                  <div key={gw} className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm font-medium capitalize">{gw}</span>
                    <span className="font-semibold">{formatCurrency(amt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Sales by Plan</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(byPlan).length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(byPlan).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm font-medium capitalize">{plan}</span>
                    <Badge variant="secondary">{count} sales</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Transaction History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Plan</th>
                  <th className="p-4 font-medium">Gateway</th>
                  <th className="p-4 font-medium">Credits</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 50).map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="p-4 text-sm">{t.createdAt ? formatDate(t.createdAt.toDate()) : "—"}</td>
                    <td className="p-4 text-sm capitalize">{t.plan || "—"}</td>
                    <td className="p-4 text-sm capitalize">{t.gateway || "—"}</td>
                    <td className="p-4 text-sm">{t.credits || 0}</td>
                    <td className="p-4 text-sm font-medium">{formatCurrency(t.amount || 0, t.currency || "usd")}</td>
                    <td className="p-4">
                      <Badge variant={t.status === "completed" ? "success" : t.status === "failed" ? "destructive" : "secondary"}>
                        {t.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No transactions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
