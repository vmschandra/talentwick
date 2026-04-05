"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getCandidateProfile, getCandidateApplications, searchJobs } from "@/lib/firebase/firestore";
import { calculateProfileCompleteness } from "@/lib/utils";
import { CandidateProfile, Application, Job, ApplicationStatus } from "@/types";
import StatsCard from "@/components/cards/StatsCard";
import JobCard from "@/components/cards/JobCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Send,
  CalendarCheck,
  UserCheck,
  Briefcase,
  ArrowRight,
  FileText,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_BADGE_MAP: Record<ApplicationStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  pending: { label: "Pending", variant: "secondary" },
  reviewed: { label: "Reviewed", variant: "outline" },
  shortlisted: { label: "Shortlisted", variant: "warning" },
  interview: { label: "Interview", variant: "default" },
  offered: { label: "Offered", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  withdrawn: { label: "Withdrawn", variant: "outline" },
};

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-lg" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    </div>
  );
}

export default function CandidateDashboardPage() {
  const { user, userDoc, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !userDoc) {
      router.push("/login");
      return;
    }

    if (!userDoc.onboardingComplete) {
      router.push("/candidate/profile");
      return;
    }

    async function fetchData() {
      try {
        const [profileData, applicationsData, jobsData] = await Promise.all([
          getCandidateProfile(user!.uid),
          getCandidateApplications(user!.uid),
          searchJobs(undefined, undefined, 6),
        ]);

        setProfile(profileData);
        setApplications(applicationsData);
        setRecommendedJobs(jobsData.jobs);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, userDoc, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!user || !userDoc) return null;

  const profileCompleteness = profile
    ? calculateProfileCompleteness(profile as unknown as Record<string, unknown>)
    : 0;

  const interviewCount = applications.filter(
    (a) => a.status === "interview"
  ).length;

  const offeredCount = applications.filter(
    (a) => a.status === "offered"
  ).length;

  const recentApplications = applications.slice(0, 5);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {userDoc.displayName?.split(" ")[0] || "there"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here is an overview of your job search activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Applications Sent"
          value={applications.length}
          icon={<Send className="h-6 w-6" />}
          description="Total applications"
        />
        <StatsCard
          title="Interviews"
          value={interviewCount}
          icon={<CalendarCheck className="h-6 w-6" />}
          description="Scheduled interviews"
        />
        <StatsCard
          title="Offers"
          value={offeredCount}
          icon={<Briefcase className="h-6 w-6" />}
          description="Job offers received"
        />
        <StatsCard
          title="Profile Strength"
          value={`${profileCompleteness}%`}
          icon={<UserCheck className="h-6 w-6" />}
          description={profileCompleteness === 100 ? "Complete" : "Needs attention"}
        />
      </div>

      {/* Profile Completeness Banner */}
      {profileCompleteness < 100 && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                Complete your profile to stand out to recruiters
              </p>
              <div className="mt-2 flex items-center gap-3">
                <Progress value={profileCompleteness} className="h-2 flex-1" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {profileCompleteness}%
                </span>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href="/candidate/profile">Complete Profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Applications</CardTitle>
              <CardDescription>Your latest job applications</CardDescription>
            </div>
            {applications.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/candidate/applications">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t applied to any jobs yet.
                </p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/candidate/jobs">Browse Jobs</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((app) => {
                  const badge = STATUS_BADGE_MAP[app.status];
                  return (
                    <Link
                      key={app.id}
                      href={`/candidate/jobs/${app.jobId}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {app.candidateName ? `Application #${app.id.slice(0, 6)}` : "Job Application"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {app.appliedAt
                            ? formatDate(app.appliedAt.toDate())
                            : "Recently"}
                        </p>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recommended Jobs</CardTitle>
              <CardDescription>Latest active openings</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/candidate/jobs">
                Browse all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recommendedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No active jobs at the moment. Check back soon!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendedJobs.slice(0, 4).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    linkPrefix="/candidate/jobs"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
