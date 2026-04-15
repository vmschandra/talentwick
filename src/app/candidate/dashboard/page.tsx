"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  getCandidateProfile,
  getCandidateApplications,
  getJobsByIds,
  getAllJobs,
} from "@/lib/firebase/firestore";
import { CandidateProfile, Application, Job, ApplicationStatus } from "@/types";
import { timeAgo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  CalendarCheck,
  Eye,
  UserCircle,
  Sparkles,
  ArrowRight,
  FileText,
  CheckCircle2,
} from "lucide-react";

// ─── Status badge config ───────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ApplicationStatus, { label: string; className: string }> = {
  pending:     { label: "Pending",     className: "bg-gray-100 text-gray-600 border-gray-200" },
  reviewed:    { label: "Reviewed",    className: "bg-blue-100 text-blue-700 border-blue-200" },
  shortlisted: { label: "Shortlisted", className: "bg-amber-100 text-amber-700 border-amber-200" },
  interview:   { label: "Interview",   className: "bg-purple-100 text-purple-700 border-purple-200" },
  offered:     { label: "Offered",     className: "bg-green-100 text-green-700 border-green-200" },
  rejected:    { label: "Rejected",    className: "bg-red-100 text-red-700 border-red-200" },
  withdrawn:   { label: "Withdrawn",   className: "bg-gray-100 text-gray-500 border-gray-200" },
};

// ─── Job scoring ───────────────────────────────────────────────────────────────
function scoreJob(job: Job, skills: string[], appliedIds: Set<string>): number {
  if (appliedIds.has(job.id) || job.status !== "active") return -1;
  if (skills.length === 0) return 0;
  const skillSet = new Set(skills.map((s) => s.toLowerCase().trim()));
  const matched = job.skills.filter((s) => skillSet.has(s.toLowerCase().trim())).length;
  return (matched / Math.max(skills.length, job.skills.length)) * 100;
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-72 rounded-lg lg:col-span-3" />
        <Skeleton className="h-72 rounded-lg lg:col-span-2" />
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function CandidateDashboardPage() {
  const { user, userDoc, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobsMap, setJobsMap] = useState<Map<string, Job>>(new Map());
  const [recommendations, setRecommendations] = useState<Array<Job & { matchScore: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !userDoc) { router.push("/login"); return; }
    if (!userDoc.onboardingComplete) { router.push("/candidate/profile"); return; }

    async function fetchAll() {
      const [profileResult, appsResult, allJobsResult] = await Promise.allSettled([
        getCandidateProfile(user!.uid),
        getCandidateApplications(user!.uid),
        getAllJobs(150),
      ]);

      const p = profileResult.status === "fulfilled" ? profileResult.value : null;
      const apps = appsResult.status === "fulfilled" ? appsResult.value : [];
      const allJobs = allJobsResult.status === "fulfilled" ? allJobsResult.value as Job[] : [];

      setProfile(p);
      setApplications(apps);

      // Batch-fetch job details for applications (title, company)
      const jobIds = Array.from(new Set(apps.map((a) => a.jobId)));
      if (jobIds.length > 0) {
        const map = await getJobsByIds(jobIds);
        setJobsMap(map);
      }

      // Score & rank recommendations
      const appliedIds = new Set(apps.map((a) => a.jobId));
      const skills = p?.skills ?? [];
      const scored = allJobs
        .map((j) => ({ ...j, matchScore: scoreJob(j, skills, appliedIds) }))
        .filter((j) => j.matchScore >= 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 4);
      setRecommendations(scored);

      setLoading(false);
    }

    fetchAll().catch(() => setLoading(false));
  }, [user, userDoc, authLoading, router]);

  if (authLoading || loading) return <DashboardSkeleton />;
  if (!user || !userDoc) return null;

  const firstName = userDoc.displayName?.split(" ")[0] || "there";
  const completeness = profile?.profileCompleteness ?? 0;
  const profileViews = profile?.profileViews ?? 0;
  const interviewCount = applications.filter((a) => a.status === "interview" || a.status === "offered").length;
  const recentApps = applications.slice(0, 5);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s a summary of your job search activity.
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Applications</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold">{applications.length}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Total submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Interviews</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <CalendarCheck className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold">{interviewCount}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Interview / Offered</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Profile Views</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <Eye className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold">{profileViews}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">By recruiters</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Profile</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <UserCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold">{completeness}%</p>
            <Progress value={completeness} className="mt-1.5 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* ── Profile completeness nudge ── */}
      {completeness < 80 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <UserCircle className="h-7 w-7 shrink-0 text-amber-700 dark:text-amber-300" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  Complete your profile to stand out
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Add skills, experience and a resume to improve your visibility to recruiters.
                </p>
              </div>
            </div>
            <Button size="sm" asChild className="shrink-0">
              <Link href="/candidate/profile">Complete Profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Main grid: Applications + Recommendations ── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Applied Jobs */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Recent Applications
            </CardTitle>
            <Link
              href="/candidate/applications"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recentApps.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Briefcase className="h-9 w-9 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No applications yet.</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/candidate/jobs">Browse Jobs</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y">
                {recentApps.map((app) => {
                  const job = jobsMap.get(app.jobId);
                  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;
                  return (
                    <li key={app.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {job?.title ?? "Job"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {job?.companyName ?? "—"} · {timeAgo(app.appliedAt.toDate())}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-xs ${cfg.className}`}
                      >
                        {cfg.label}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recommended Jobs */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Recommended
            </CardTitle>
            <Link
              href="/candidate/jobs"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              All jobs <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recommendations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Sparkles className="h-9 w-9 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {(profile?.skills?.length ?? 0) === 0
                    ? "Add skills to your profile to see recommendations."
                    : "No new jobs to recommend right now."}
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {recommendations.map((job) => (
                  <li key={job.id} className="py-3">
                    <Link href={`/candidate/jobs/${job.id}`} className="group block">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                            {job.title}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {job.companyName} · {job.location}
                          </p>
                        </div>
                        {job.matchScore > 0 && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            {Math.round(Math.min(job.matchScore, 100))}%
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{job.jobType.replace("-", " ")}</span>
                        <span>·</span>
                        <span className="capitalize">{job.workMode}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── Quick actions ── */}
      <div className="flex flex-wrap gap-3 pb-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/candidate/profile">
            <UserCircle className="mr-1.5 h-3.5 w-3.5" /> Edit Profile
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/candidate/jobs">
            <Briefcase className="mr-1.5 h-3.5 w-3.5" /> Browse Jobs
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/candidate/applications">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> All Applications
          </Link>
        </Button>
      </div>

    </div>
  );
}
