"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  getRecruiterJobs,
  getAllCandidateProfiles,
} from "@/lib/firebase/firestore";
import { CandidateProfile, Job } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Users,
  MapPin,
  Briefcase,
  PlusCircle,
} from "lucide-react";

interface ScoredCandidate extends CandidateProfile {
  matchScore: number;
  matchedSkills: string[];
}

function scoreCandidate(candidate: CandidateProfile, jobSkills: Set<string>): ScoredCandidate {
  const candidateSkills = candidate.skills || [];
  const matchedSkills = candidateSkills.filter((s) =>
    jobSkills.has(s.toLowerCase().trim())
  );
  const score = jobSkills.size > 0 ? (matchedSkills.length / jobSkills.size) * 100 : 0;
  return { ...candidate, matchScore: score, matchedSkills };
}

export default function RecruiterHomePage() {
  const { user, userDoc, loading: authLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommendations, setRecommendations] = useState<ScoredCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !userDoc) {
      router.push("/login");
      return;
    }

    if (!userDoc.onboardingComplete) {
      router.push("/recruiter/company-profile");
      return;
    }

    async function fetchData() {
      const [jobsResult, candidatesResult] = await Promise.allSettled([
        getRecruiterJobs(user!.uid),
        getAllCandidateProfiles(),
      ]);

      const recruiterJobs = jobsResult.status === "fulfilled" ? jobsResult.value : [];
      const allCandidates = candidatesResult.status === "fulfilled" ? candidatesResult.value : [];

      setJobs(recruiterJobs);

      // Build skill set from all active jobs posted by this recruiter
      const jobSkills = new Set<string>();
      recruiterJobs
        .filter((j) => j.status === "active")
        .forEach((j) => j.skills?.forEach((s) => jobSkills.add(s.toLowerCase().trim())));

      const scored = allCandidates
        .filter((c) => c.openToWork !== false)
        .map((c) => scoreCandidate(c, jobSkills))
        .sort((a, b) => b.matchScore - a.matchScore);

      setRecommendations(scored);
      setLoading(false);
    }

    fetchData();
  }, [user, userDoc, authLoading, router]);

  if (authLoading || loading) {
    return <HomeSkeleton />;
  }

  if (!user || !userDoc) return null;

  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const topMatches = recommendations.filter((c) => c.matchScore > 0).slice(0, 8);
  const otherCandidates = recommendations.filter((c) => c.matchScore === 0).slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {userDoc.displayName?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {activeJobs > 0
              ? "Candidates matched to the skills you're hiring for."
              : "Post a job to see candidate recommendations."}
          </p>
        </div>
        <Button asChild>
          <Link href="/recruiter/post-job">
            <PlusCircle className="mr-2 h-4 w-4" /> Post a Job
          </Link>
        </Button>
      </div>

      {activeJobs === 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Briefcase className="h-10 w-10 text-yellow-700 dark:text-yellow-300" />
            <p className="font-medium text-yellow-900 dark:text-yellow-100">
              No active jobs yet
            </p>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Post your first job to get recommended candidates based on the skills you need.
            </p>
            <Button asChild className="mt-2">
              <Link href="/recruiter/post-job">Post Your First Job</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {activeJobs > 0 && topMatches.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Recommended candidates</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {topMatches.map((candidate) => (
              <CandidateCard key={candidate.uid} candidate={candidate} />
            ))}
          </div>
        </section>
      )}

      {activeJobs > 0 && topMatches.length === 0 && recommendations.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              No candidates match the skills for your posted jobs yet.
            </p>
          </CardContent>
        </Card>
      )}

      {otherCandidates.length > 0 && topMatches.length === 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Browse candidates</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {otherCandidates.map((candidate) => (
              <CandidateCard key={candidate.uid} candidate={candidate} />
            ))}
          </div>
        </section>
      )}

      {recommendations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No candidates available yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CandidateCard({ candidate }: { candidate: ScoredCandidate }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg truncate">
              {candidate.headline || "Candidate"}
            </h3>
            {candidate.location && (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {candidate.location}
              </p>
            )}
          </div>
          {candidate.matchScore > 0 && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {Math.round(Math.min(candidate.matchScore, 100))}% match
            </span>
          )}
        </div>

        {candidate.summary && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {candidate.summary}
          </p>
        )}

        {candidate.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {candidate.skills.slice(0, 6).map((skill) => {
              const isMatched = candidate.matchedSkills.includes(skill);
              return (
                <Badge
                  key={skill}
                  variant={isMatched ? "default" : "secondary"}
                  className="text-xs"
                >
                  {skill}
                </Badge>
              );
            })}
            {candidate.skills.length > 6 && (
              <Badge variant="secondary" className="text-xs">
                +{candidate.skills.length - 6}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div>
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
