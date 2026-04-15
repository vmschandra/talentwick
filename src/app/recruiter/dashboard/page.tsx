"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  getRecruiterJobs,
  getAllCandidateProfiles,
  getRecruiterApplications,
  getRecruiterCredits,
} from "@/lib/firebase/firestore";
import { CandidateProfile, Job, Application } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  ArrowRight,
  Briefcase,
  Users,
  CalendarCheck,
  CreditCard,
  MapPin,
  PlusCircle,
  Sparkles,
  Clock,
  CheckCircle2,
  Eye,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScoredCandidate extends CandidateProfile {
  matchScore: number;
  matchedSkills: string[];
}

function scoreCandidate(c: CandidateProfile, jobSkills: Set<string>): ScoredCandidate {
  const matched = (c.skills || []).filter((s) =>
    jobSkills.has(s.toLowerCase().trim())
  );
  const score = jobSkills.size > 0 ? (matched.length / jobSkills.size) * 100 : 0;
  return { ...c, matchScore: score, matchedSkills: matched };
}

const JOB_STATUS_STYLE: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  paused: "bg-yellow-100 text-yellow-700 border-yellow-200",
  closed: "bg-red-100 text-red-600 border-red-200",
  expired: "bg-orange-100 text-orange-700 border-orange-200",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RecruiterDashboard() {
  const { user, userDoc, loading: authLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [candidates, setCandidates] = useState<ScoredCandidate[]>([]);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !userDoc) { router.push("/login"); return; }

    async function fetchAll() {
      const [jobsRes, appsRes, candidatesRes, creditsRes] = await Promise.allSettled([
        getRecruiterJobs(user!.uid),
        getRecruiterApplications(user!.uid),
        getAllCandidateProfiles(),
        getRecruiterCredits(user!.uid),
      ]);

      const myJobs = jobsRes.status === "fulfilled" ? jobsRes.value : [];
      const myApps = appsRes.status === "fulfilled" ? appsRes.value : [];
      const allCandidates = candidatesRes.status === "fulfilled" ? candidatesRes.value : [];
      const myCredits = creditsRes.status === "fulfilled" ? creditsRes.value : 0;

      setJobs(myJobs);
      setApplications(myApps);
      setCredits(myCredits);

      const jobSkills = new Set<string>();
      myJobs
        .filter((j) => j.status === "active")
        .forEach((j) => j.skills?.forEach((s) => jobSkills.add(s.toLowerCase().trim())));

      const scored = allCandidates
        .filter((c) => c.openToWork !== false)
        .map((c) => scoreCandidate(c, jobSkills))
        .sort((a, b) => b.matchScore - a.matchScore);

      setCandidates(scored);
      setLoading(false);
    }

    fetchAll();
  }, [user, userDoc, authLoading, router]);

  if (authLoading || loading) return <DashboardSkeleton />;
  if (!user || !userDoc) return null;

  const activeJobs = jobs.filter((j) => j.status === "active");
  const interviews = applications.filter((a) => a.status === "interview");
  const recentJobs = jobs.slice(0, 6);
  const topCandidates = candidates.slice(0, 4);

  return (
    <div className="space-y-7">
      {/* Onboarding nudge */}
      {!userDoc.onboardingComplete && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <Building2 className="h-4 w-4 shrink-0" />
            Complete your company profile to start posting jobs and attract candidates.
          </div>
          <Link
            href="/recruiter/company-profile"
            className="ml-4 flex shrink-0 items-center gap-1 font-medium text-amber-900 hover:underline"
          >
            Set up now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{userDoc.displayName ? `, ${userDoc.displayName.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of your hiring activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Briefcase className="h-5 w-5 text-primary" />}
          label="Active Postings"
          value={activeJobs.length}
          href="/recruiter/my-jobs"
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-blue-600" />}
          label="Total Applicants"
          value={applications.length}
          href="/recruiter/my-jobs"
        />
        <StatCard
          icon={<CalendarCheck className="h-5 w-5 text-violet-600" />}
          label="Interviews"
          value={interviews.length}
        />
        <StatCard
          icon={<CreditCard className="h-5 w-5 text-amber-600" />}
          label="Credits Left"
          value={credits}
          href="/recruiter/pricing"
        />
      </div>

      {/* Jobs + Interviews */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Your Jobs (3/5) */}
        <section className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Your Job Postings</h2>
            <div className="flex gap-2">
              <Link href="/recruiter/post-job">
                <Button size="sm" variant="outline" className="gap-1 h-8 text-xs">
                  <PlusCircle className="h-3.5 w-3.5" /> Post a Job
                </Button>
              </Link>
              <Link href="/recruiter/my-jobs">
                <Button size="sm" variant="ghost" className="gap-1 h-8 text-xs text-muted-foreground">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>

          {recentJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <Briefcase className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No jobs posted yet.</p>
                <Link href="/recruiter/post-job">
                  <Button size="sm">Post Your First Job</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <Link key={job.id} href={`/recruiter/my-jobs/${job.id}`}>
                  <Card className="transition-shadow hover:shadow-sm cursor-pointer">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {job.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {job.viewCount ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {job.applicantCount ?? 0}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-xs font-medium ${
                            JOB_STATUS_STYLE[job.status] ?? ""
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Interviews (2/5) */}
        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Interviews</h2>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </div>

          {interviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <CalendarCheck className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No interviews scheduled yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {interviews.slice(0, 6).map((app) => (
                <Link key={app.id} href={`/recruiter/my-jobs/${app.jobId}/applicants`}>
                  <Card className="transition-shadow hover:shadow-sm cursor-pointer">
                    <CardContent className="p-4 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">{app.candidateName}</p>
                        <CheckCircle2 className="h-4 w-4 text-violet-500 shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{app.candidateEmail}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {app.updatedAt?.toDate
                          ? app.updatedAt.toDate().toLocaleDateString()
                          : "—"}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {interviews.length > 6 && (
                <p className="text-center text-xs text-muted-foreground pt-1">
                  +{interviews.length - 6} more
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      <Separator />

      {/* Recommended Candidates */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Recommended Candidates</h2>
          </div>
          <Link href="/recruiter/browse-candidates">
            <Button size="sm" variant="ghost" className="gap-1 h-8 text-xs text-muted-foreground">
              Browse all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {topCandidates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No candidates available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {topCandidates.map((c) => (
              <Card key={c.uid} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{c.headline || "Candidate"}</p>
                      {c.location && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3" /> {c.location}
                        </p>
                      )}
                    </div>
                    {c.matchScore > 0 && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {Math.round(Math.min(c.matchScore, 100))}%
                      </span>
                    )}
                  </div>
                  {c.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.skills.slice(0, 4).map((s) => (
                        <Badge
                          key={s}
                          variant={c.matchedSkills.includes(s) ? "default" : "secondary"}
                          className="text-xs px-1.5 py-0"
                        >
                          {s}
                        </Badge>
                      ))}
                      {c.skills.length > 4 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                          +{c.skills.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href?: string;
}) {
  const inner = (
    <Card className={href ? "hover:shadow-md transition-shadow cursor-pointer" : ""}>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-1">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <div className="lg:col-span-2 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}
