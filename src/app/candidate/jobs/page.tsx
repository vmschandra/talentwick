"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useJobSearch } from "@/hooks/useJobs";
import { JobFilters, JobType, WorkMode, ExperienceLevel } from "@/types";
import { WORLD_LOCATIONS } from "@/lib/data/locations";
import SearchableSelect from "@/components/shared/SearchableSelect";
import JobCard from "@/components/cards/JobCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, SlidersHorizontal, Briefcase, Loader2 } from "lucide-react";

const COUNTRIES = Object.keys(WORLD_LOCATIONS).sort();

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

const WORK_MODES: { value: WorkMode; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executive" },
];

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
  const searchParams = useSearchParams();
  const { jobs, loading, hasMore, search } = useJobSearch();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [locationCountry, setLocationCountry] = useState(searchParams.get("country") || "");
  const [locationCity, setLocationCity] = useState(searchParams.get("city") || "");
  const [jobType, setJobType] = useState<string>(searchParams.get("type") || "");
  const [workMode, setWorkMode] = useState<string>(searchParams.get("mode") || "");
  const [experienceLevel, setExperienceLevel] = useState<string>(searchParams.get("level") || "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const initialized = useRef(false);

  const location = locationCity
    ? `${locationCity}, ${locationCountry}`
    : locationCountry;

  const buildFilters = useCallback((): JobFilters => {
    const filters: JobFilters = {};
    if (keyword.trim()) filters.keyword = keyword.trim();
    if (location.trim()) filters.location = location.trim();
    if (jobType) filters.jobType = [jobType as JobType];
    if (workMode) filters.workMode = [workMode as WorkMode];
    if (experienceLevel) filters.experienceLevel = experienceLevel as ExperienceLevel;
    return filters;
  }, [keyword, location, jobType, workMode, experienceLevel]);

  const syncURL = useCallback(() => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (locationCountry) params.set("country", locationCountry);
    if (locationCity) params.set("city", locationCity);
    if (jobType) params.set("type", jobType);
    if (workMode) params.set("mode", workMode);
    if (experienceLevel) params.set("level", experienceLevel);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/candidate/jobs", { scroll: false });
  }, [keyword, locationCountry, locationCity, jobType, workMode, experienceLevel, router]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  // Initial load from URL params
  useEffect(() => {
    if (authLoading || !user || initialized.current) return;
    initialized.current = true;
    search(buildFilters(), true).then(() => setInitialLoad(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  function handleSearch() {
    syncURL();
    search(buildFilters(), true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function handleLoadMore() {
    search(buildFilters(), false);
  }

  function clearFilters() {
    setKeyword("");
    setLocationCountry("");
    setLocationCity("");
    setJobType("");
    setWorkMode("");
    setExperienceLevel("");
    router.replace("/candidate/jobs", { scroll: false });
    search({}, true);
  }

  const hasActiveFilters =
    keyword.trim() || location.trim() || jobType || workMode || experienceLevel;

  if (authLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Find Jobs</h1>
        <p className="mt-1 text-muted-foreground">
          Discover opportunities that match your skills and interests.
        </p>
      </div>

      {/* Search bar */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Job title, keyword, or skill..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <div className="sm:w-44">
            <SearchableSelect
              value={locationCountry}
              onChange={(v) => { setLocationCountry(v); setLocationCity(""); }}
              options={COUNTRIES}
              placeholder="Country"
            />
          </div>
          <div className="sm:w-44">
            <SearchableSelect
              value={locationCity}
              onChange={setLocationCity}
              options={locationCountry ? (WORLD_LOCATIONS[locationCountry] ?? []) : []}
              placeholder={locationCountry ? "City" : "Select country first"}
              disabled={!locationCountry}
            />
          </div>
          <Button onClick={handleSearch} className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 sm:hidden"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
          <div
            className={`flex-1 flex-wrap items-center gap-2 ${
              filtersOpen ? "flex" : "hidden sm:flex"
            }`}
          >
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={workMode} onValueChange={setWorkMode}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Work Mode" />
              </SelectTrigger>
              <SelectContent>
                {WORK_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {initialLoad ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold">
            {hasActiveFilters ? "No jobs match your search" : "No jobs available yet"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            {hasActiveFilters
              ? "Try different keywords or broaden your filters."
              : "New jobs are posted regularly — check back soon."}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} linkPrefix="/candidate/jobs" />
            ))}
          </div>
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Jobs"
                )}
              </Button>
            </div>
          )}
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
