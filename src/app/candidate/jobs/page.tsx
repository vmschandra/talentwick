"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAllJobs } from "@/lib/firebase/firestore";
import { Job } from "@/types";
import { parseLocation } from "@/lib/utils";
import { WORLD_LOCATIONS } from "@/lib/data/locations";
import SearchBar, { SearchValues } from "@/components/shared/SearchBar";
import JobCard from "@/components/cards/JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";

export default function CandidateJobsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <JobsContent />
    </Suspense>
  );
}

function JobsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState<SearchValues>({ title: "", city: "", country: "" });

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  // Load all active jobs once
  useEffect(() => {
    getAllJobs(500)
      .then((all) => setJobs((all as Job[]).filter((j) => j.status === "active")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Autocomplete suggestions derived from real job data ──
  const titleSuggestions = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.title).filter(Boolean))).sort(),
    [jobs]
  );
  const citySuggestions = useMemo(
    () => Array.from(new Set(
      jobs.map((j) => parseLocation(j.location ?? "").city).filter(Boolean)
    )).sort(),
    [jobs]
  );
  // Use the full country list so the dropdown works regardless of what jobs exist
  const countrySuggestions = useMemo(
    () => Object.keys(WORLD_LOCATIONS).sort(),
    []
  );

  // ── Filter results ──
  const filtered = useMemo(() => {
    const t = search.title.toLowerCase();
    const ci = search.city.toLowerCase();
    const co = search.country.toLowerCase();
    return jobs.filter((j) => {
      if (t && !j.title?.toLowerCase().includes(t) && !j.description?.toLowerCase().includes(t)) return false;
      const loc = parseLocation(j.location ?? "");
      if (ci && !loc.city.toLowerCase().includes(ci)) return false;
      if (co && !loc.country.toLowerCase().includes(co)) return false;
      return true;
    });
  }, [jobs, search]);

  const isFiltering = search.title || search.city || search.country;

  if (authLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Find Jobs</h1>
        <p className="mt-1 text-muted-foreground">
          Discover opportunities that match your skills and interests.
        </p>
      </div>

      <SearchBar
        titleSuggestions={titleSuggestions}
        citySuggestions={citySuggestions}
        countrySuggestions={countrySuggestions}
        onSearch={setSearch}
        titlePlaceholder="Job title or keyword"
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold">
            {isFiltering ? "No jobs match your search" : "No jobs available yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            {isFiltering
              ? "Try different keywords or broaden your location."
              : "New jobs are posted regularly — check back soon."}
          </p>
          {isFiltering && (
            <Button variant="outline" className="mt-4"
              onClick={() => setSearch({ title: "", city: "", country: "" })}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {filtered.length} job{filtered.length !== 1 ? "s" : ""} found
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} linkPrefix="/candidate/jobs" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
