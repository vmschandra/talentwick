"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getRecruiterJobs,
  getAllCandidateProfiles,
} from "@/lib/firebase/firestore";
import { CandidateProfile, Job } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Users, MapPin } from "lucide-react";

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
  const matchedCandidates = recommendations.filter((c) => c.matchScore > 0);
  const otherCandidates = recommendations.filter((c) => c.matchScore === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
        <p className="mt-1 text-muted-foreground">
          {activeJobs > 0
            ? "Top matches for your active job postings are shown first."
            : "Browse all candidates available for hiring."}
        </p>
      </div>

      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No candidates available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {matchedCandidates.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Recommended for your jobs</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {matchedCandidates.map((candidate) => (
                  <CandidateCard key={candidate.uid} candidate={candidate} />
                ))}
              </div>
            </section>
          )}

          {otherCandidates.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">
                {matchedCandidates.length > 0 ? "Other candidates" : "All candidates"}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {otherCandidates.map((candidate) => (
                  <CandidateCard key={candidate.uid} candidate={candidate} />
                ))}
              </div>
            </section>
          )}
        </>
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
