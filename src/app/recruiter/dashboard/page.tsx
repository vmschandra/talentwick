"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getRecruiterProfile, getRecruiterJobs } from "@/lib/firebase/firestore";
import { RecruiterProfile, Job, JobStatus } from "@/types";
import { formatCurrency, timeAgo } from "@/lib/utils";
import StatsCard from "@/components/cards/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Users,
  CreditCard,
  DollarSign,
  PlusCircle,
  ArrowRight,
  Eye,
} from "lucide-react";

const statusVariant: Record<JobStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  draft: "secondary",
  active: "success",
  paused: "warning",
  closed: "destructive",
  expired: "secondary",
};

export default function RecruiterDashboard() {
  const { user, userDoc, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (userDoc && !userDoc.onboardingComplete) {
      router.push("/recruiter/company-profile");
      return;
    }

    if (!user) return;

    async function fetchData() {
      try {
        const [profileData, jobsData] = await Promise.all([
          getRecruiterProfile(user!.uid),
          getRecruiterJobs(user!.uid),
        ]);
        setProfile(profileData);
        setJobs(jobsData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, userDoc, authLoading, router]);

  if (authLoading || loading) {
    return <DashboardSkeleton />;
  }

  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicantCount || 0), 0);
  const credits = profile?.jobPostCredits ?? 0;
  const totalSpent = profile?.totalSpent ?? 0;
  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back{profile?.companyName ? `, ${profile.companyName}` : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/recruiter/post-job">
              <PlusCircle className="mr-2 h-4 w-4" /> Post a Job
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/recruiter/pricing">
              <CreditCard className="mr-2 h-4 w-4" /> Buy Credits
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Jobs"
          value={activeJobs}
          description={`${jobs.length} total`}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatsCard
          title="Total Applicants"
          value={totalApplicants}
          icon={<Users className="h-5 w-5" />}
        />
        <StatsCard
          title="Credits Remaining"
          value={credits}
          description={credits < 2 ? "Running low" : undefined}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatsCard
          title="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Job Postings</CardTitle>
          {jobs.length > 5 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/recruiter/my-jobs">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No jobs posted yet</p>
              <Button asChild>
                <Link href="/recruiter/post-job">Post Your First Job</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/recruiter/my-jobs/${job.id}`}
                      className="font-medium hover:underline"
                    >
                      {job.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant={statusVariant[job.status]}>{job.status}</Badge>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {job.viewCount} view{job.viewCount !== 1 ? "s" : ""}
                      </span>
                      <span>
                        {job.createdAt?.toDate ? timeAgo(job.createdAt.toDate()) : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/recruiter/my-jobs/${job.id}/applicants`}>
                        Applicants
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/recruiter/my-jobs/${job.id}`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
