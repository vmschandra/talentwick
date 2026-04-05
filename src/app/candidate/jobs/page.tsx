"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useJobSearch } from "@/hooks/useJobs";
import { JobFilters } from "@/types";
import SearchBar from "@/components/shared/SearchBar";
import FilterPanel from "@/components/shared/FilterPanel";
import JobCard from "@/components/cards/JobCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SlidersHorizontal, X, Briefcase, Loader2 } from "lucide-react";

export default function CandidateJobsPage() {
  return (
    <Suspense fallback={<div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <CandidateJobsContent />
    </Suspense>
  );
}

function CandidateJobsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { jobs, loading, hasMore, search } = useJobSearch();

  const [filters, setFilters] = useState<JobFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Sync URL params to filter state on mount
  useEffect(() => {
    const keyword = searchParams.get("keyword") || undefined;
    const location = searchParams.get("location") || undefined;
    const jobType = searchParams.get("jobType")
      ? [searchParams.get("jobType") as JobFilters["jobType"] extends (infer U)[] | undefined ? U : never]
      : undefined;
    const workMode = searchParams.get("workMode")
      ? [searchParams.get("workMode") as JobFilters["workMode"] extends (infer U)[] | undefined ? U : never]
      : undefined;
    const experienceLevel = (searchParams.get("experienceLevel") || undefined) as
      | JobFilters["experienceLevel"]
      | undefined;

    const initialFilters: JobFilters = {
      ...(keyword && { keyword }),
      ...(location && { location }),
      ...(jobType && { jobType: jobType as JobFilters["jobType"] }),
      ...(workMode && { workMode: workMode as JobFilters["workMode"] }),
      ...(experienceLevel && { experienceLevel }),
    };

    setFilters(initialFilters);
    setInitialized(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Run search whenever filters change (after init)
  useEffect(() => {
    if (!initialized) return;
    search(filters, true);
    syncFiltersToURL(filters);
  }, [filters, initialized]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if not authed
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const syncFiltersToURL = useCallback(
    (f: JobFilters) => {
      const params = new URLSearchParams();
      if (f.keyword) params.set("keyword", f.keyword);
      if (f.location) params.set("location", f.location);
      if (f.jobType?.length) params.set("jobType", f.jobType[0]);
      if (f.workMode?.length) params.set("workMode", f.workMode[0]);
      if (f.experienceLevel) params.set("experienceLevel", f.experienceLevel);

      const queryString = params.toString();
      const newPath = queryString ? `?${queryString}` : "";
      router.replace(`/candidate/jobs${newPath}`, { scroll: false });
    },
    [router]
  );

  const handleSearch = (keyword: string, location: string) => {
    setFilters((prev) => ({
      ...prev,
      keyword: keyword || undefined,
      location: location || undefined,
    }));
  };

  const handleFilterChange = (newFilters: JobFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Preserve search bar values
      keyword: prev.keyword,
      location: prev.location,
    }));
  };

  const handleLoadMore = () => {
    search(filters, false);
  };

  const activeFilterCount = [
    filters.jobType?.length,
    filters.workMode?.length,
    filters.experienceLevel,
  ].filter(Boolean).length;

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-12 w-full mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Find Jobs</h1>
        <p className="mt-1 text-muted-foreground">
          Discover opportunities that match your skills and interests.
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} className="mb-6" />

      <div className="flex gap-6">
        {/* Sidebar Filters — Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <FilterPanel filters={filters} onChange={handleFilterChange} />
        </aside>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            size="lg"
            className="rounded-full shadow-lg"
          >
            {showFilters ? (
              <X className="mr-2 h-4 w-4" />
            ) : (
              <SlidersHorizontal className="mr-2 h-4 w-4" />
            )}
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Mobile Filter Panel (overlay) */}
        {showFilters && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowFilters(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-background p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Filters</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <FilterPanel filters={filters} onChange={handleFilterChange} />
              <Button
                className="mt-4 w-full"
                onClick={() => setShowFilters(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        {/* Job Results */}
        <div className="flex-1 min-w-0">
          {loading && jobs.length === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[200px] rounded-lg" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No jobs found</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                Try adjusting your search terms or filters. New jobs are posted
                regularly, so check back soon.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setFilters({});
                }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                Showing {jobs.length} job{jobs.length !== 1 ? "s" : ""}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    linkPrefix="/candidate/jobs"
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Loading...
                      </>
                    ) : (
                      "Load more jobs"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
