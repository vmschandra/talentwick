"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MapPin,
  Briefcase,
  Monitor,
  BarChart3,
  Loader2,
  X,
  SlidersHorizontal,
  SearchX,
} from "lucide-react";

import { useJobSearch } from "@/hooks/useJobs";
import { JobFilters, JobType, WorkMode, ExperienceLevel, Job } from "@/types";
import { formatSalary, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Filter options ──────────────────────────────────────
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

// ─── JobCard ────────────────────────────────────────────
function JobCard({ job }: { job: Job }) {
  const salary = formatSalary(job.salary);

  return (
    <Link href={`/job/${job.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Company logo or fallback */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.companyName}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                job.companyName.charAt(0).toUpperCase()
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold leading-snug truncate">
                    {job.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {job.companyName}
                  </p>
                </div>
                {job.isFeatured && (
                  <Badge variant="warning" className="shrink-0">Featured</Badge>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  {job.jobType.replace("-", " ")}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Monitor className="h-3.5 w-3.5" />
                  {job.workMode}
                </span>
                <span className="inline-flex items-center gap-1">
                  <BarChart3 className="h-3.5 w-3.5" />
                  {job.experienceLevel}
                </span>
              </div>

              {salary && (
                <p className="mt-2 text-sm font-medium text-green-700">
                  {salary}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.skills.slice(0, 4).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{job.skills.length - 4}
                  </Badge>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""}
                </span>
                <span>{timeAgo(job.createdAt.toDate())}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── JobCard Skeleton ───────────────────────────────────
function JobCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-3">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function BrowseJobsPage() {
  return (
    <Suspense fallback={<div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <BrowseJobsContent />
    </Suspense>
  );
}

function BrowseJobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { jobs, loading, hasMore, search } = useJobSearch();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [jobType, setJobType] = useState<string>(searchParams.get("type") || "");
  const [workMode, setWorkMode] = useState<string>(searchParams.get("mode") || "");
  const [experienceLevel, setExperienceLevel] = useState<string>(
    searchParams.get("level") || ""
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const buildFilters = useCallback((): JobFilters => {
    const filters: JobFilters = {};
    if (keyword.trim()) filters.keyword = keyword.trim();
    if (location.trim()) filters.location = location.trim();
    if (jobType) filters.jobType = [jobType as JobType];
    if (workMode) filters.workMode = [workMode as WorkMode];
    if (experienceLevel)
      filters.experienceLevel = experienceLevel as ExperienceLevel;
    return filters;
  }, [keyword, location, jobType, workMode, experienceLevel]);

  // Sync filters to URL
  const syncURL = useCallback(() => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (location.trim()) params.set("location", location.trim());
    if (jobType) params.set("type", jobType);
    if (workMode) params.set("mode", workMode);
    if (experienceLevel) params.set("level", experienceLevel);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/browse-jobs", { scroll: false });
  }, [keyword, location, jobType, workMode, experienceLevel, router]);

  // Initial search from URL params
  useEffect(() => {
    search(buildFilters(), true).then(() => setInitialLoad(false));
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch() {
    syncURL();
    search(buildFilters(), true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  function handleLoadMore() {
    search(buildFilters(), false);
  }

  function clearFilters() {
    setKeyword("");
    setLocation("");
    setJobType("");
    setWorkMode("");
    setExperienceLevel("");
    router.replace("/browse-jobs", { scroll: false });
    search({}, true);
  }

  const hasActiveFilters =
    keyword.trim() || location.trim() || jobType || workMode || experienceLevel;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Browse Jobs</h1>
        <p className="mt-1 text-muted-foreground">
          Find your next opportunity from top companies
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6 space-y-4">
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
          <div className="relative sm:w-56">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="City or region..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} className="gap-2 sm:w-auto">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>

        {/* Filter Toggle (mobile) + Inline Filters (desktop) */}
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
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={workMode} onValueChange={setWorkMode}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Work Mode" />
              </SelectTrigger>
              <SelectContent>
                {WORK_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
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
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <SearchX className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">No Jobs Found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filters to find what you&apos;re
              looking for.
            </p>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            Showing {jobs.length} job{jobs.length !== 1 ? "s" : ""}
          </p>

          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-8 flex justify-center">
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
