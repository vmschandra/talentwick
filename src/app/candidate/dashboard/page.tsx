"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getCandidateProfile, searchJobs } from "@/lib/firebase/firestore";
import { CandidateProfile, Job } from "@/types";
import JobCard from "@/components/cards/JobCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Sparkles, UserCircle } from "lucide-react";

function scoreJob(job: Job, candidateSkills: string[], candidateLocation?: string): number {
  if (candidateSkills.length === 0) return 0;
  const skillSet = new Set(candidateSkills.map((s) => s.toLowerCase().trim()));
  const matchedSkills = job.skills.filter((s) => skillSet.has(s.toLowerCase().trim())).length;
  const skillScore = (matchedSkills / Math.max(candidateSkills.length, job.skills.length)) * 100;
  const locationBoost = candidateLocation && job.location.toLowerCase().includes(candidateLocation.toLowerCase()) ? 10 : 0;
  return skillScore + locationBoost;
}

export default function CandidateHomePage() {
  const { user, userDoc, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<Array<Job & { matchScore: number }>>([]);
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
      const [profileResult, jobsResult] = await Promise.allSettled([
        getCandidateProfile(user!.uid),
        searchJobs(undefined, undefined, 50),
      ]);

      const candidateProfile = profileResult.status === "fulfilled" ? profileResult.value : null;
      setProfile(candidateProfile);

      if (jobsResult.status === "fulfilled") {
        const jobs = jobsResult.value.jobs;
        const candidateSkills = candidateProfile?.skills || [];
        const candidateLocation = candidateProfile?.location;

        const scored = jobs
          .map((job) => ({ ...job, matchScore: scoreJob(job, candidateSkills, candidateLocation) }))
          .sort((a, b) => b.matchScore - a.matchScore);

        setRecommendedJobs(scored);
      }

      setLoading(false);
    }

    fetchData();
  }, [user, userDoc, authLoading, router]);

  if (authLoading || loading) {
    return <HomeSkeleton />;
  }

  if (!user || !userDoc) return null;

  const hasSkills = (profile?.skills?.length || 0) > 0;
  const topMatches = recommendedJobs.filter((j) => j.matchScore > 0).slice(0, 8);
  const otherJobs = recommendedJobs.filter((j) => j.matchScore === 0).slice(0, 6);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {userDoc.displayName?.split(" ")[0] || "there"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {hasSkills
            ? "Jobs picked for you based on your skills and profile."
            : "Add skills to your profile to get personalized recommendations."}
        </p>
      </div>

      {!hasSkills && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <UserCircle className="h-8 w-8 text-yellow-700 dark:text-yellow-300" />
              <div>
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Complete your profile to get matched
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Add your skills, experience, and resume so we can recommend the best jobs.
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/candidate/profile">Complete Profile</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {hasSkills && topMatches.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Recommended for you</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {topMatches.map((job) => (
              <div key={job.id} className="relative">
                <JobCard job={job} linkPrefix="/candidate/jobs" />
                {job.matchScore >= 30 && (
                  <span className="absolute right-3 top-3 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {Math.round(Math.min(job.matchScore, 100))}% match
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {otherJobs.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">
            {topMatches.length > 0 ? "Other opportunities" : "Latest jobs"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {otherJobs.map((job) => (
              <JobCard key={job.id} job={job} linkPrefix="/candidate/jobs" />
            ))}
          </div>
        </section>
      )}

      {recommendedJobs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No active jobs available right now.</p>
            <Button variant="outline" asChild>
              <Link href="/candidate/jobs">Browse all jobs</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div>
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
