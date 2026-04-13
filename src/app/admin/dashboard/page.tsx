"use client";

import { useEffect, useState } from "react";
import { getAllUsers, getAllJobs, getAllTransactions } from "@/lib/firebase/firestore";
import StatsCard from "@/components/cards/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { Job } from "@/types";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, candidates: 0, recruiters: 0, jobs: 0, activeJobs: 0, revenue: 0, transactions: 0 });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ desc: string; time: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [users, jobs, txns] = await Promise.all([
          getAllUsers(),
          getAllJobs(),
          getAllTransactions(),
        ]);

        const candidates = users.filter((u: Record<string, unknown>) => u.role === "candidate").length;
        const recruiters = users.filter((u: Record<string, unknown>) => u.role === "recruiter").length;
        const activeJobs = jobs.filter((j) => j.status === "active").length;
        const totalRevenue = txns
          .filter((t: Record<string, unknown>) => t.status === "completed")
          .reduce((sum: number, t: Record<string, unknown>) => sum + ((t.amount as number) || 0), 0);

        setStats({
          users: users.length,
          candidates,
          recruiters,
          jobs: jobs.length,
          activeJobs,
          revenue: totalRevenue,
          transactions: txns.length,
        });

        setRecentJobs(jobs.slice(0, 5));

        const activity: { desc: string; time: string }[] = [];
        txns.slice(0, 5).forEach((t: Record<string, unknown>) => {
          activity.push({
            desc: `Credit purchase: ${t.credits} credits (${t.gateway})`,
            time: t.createdAt ? timeAgo((t.createdAt as { toDate: () => Date }).toDate()) : "recently",
          });
        });
        setRecentActivity(activity);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Users" value={stats.users} description={`${stats.candidates} candidates, ${stats.recruiters} recruiters`} icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Total Jobs" value={stats.jobs} description={`${stats.activeJobs} active`} icon={<Briefcase className="h-5 w-5" />} />
        <StatsCard title="Revenue" value={formatCurrency(stats.revenue)} icon={<DollarSign className="h-5 w-5" />} />
        <StatsCard title="Transactions" value={stats.transactions} icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Jobs</CardTitle></CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs yet.</p>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.companyName}</p>
                    </div>
                    <Badge variant={job.status === "active" ? "success" : "secondary"}>{job.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border p-3">
                    <p className="text-sm">{a.desc}</p>
                    <span className="text-xs text-muted-foreground">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
