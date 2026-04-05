"use client";

import { useState, useCallback } from "react";
import { searchJobs, getRecruiterJobs } from "@/lib/firebase/firestore";
import { Job, JobFilters } from "@/types";
import { DocumentSnapshot } from "firebase/firestore";

export function useJobSearch() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const search = useCallback(async (filters?: JobFilters, reset = true) => {
    setLoading(true);
    try {
      const result = await searchJobs(filters, reset ? undefined : lastDoc || undefined);
      if (reset) {
        setJobs(result.jobs);
      } else {
        setJobs((prev) => [...prev, ...result.jobs]);
      }
      setLastDoc(result.lastDoc);
      setHasMore(result.jobs.length === 20);
    } finally {
      setLoading(false);
    }
  }, [lastDoc]);

  return { jobs, loading, hasMore, search };
}

export function useRecruiterJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchJobs = useCallback(async (recruiterId: string) => {
    setLoading(true);
    try {
      const result = await getRecruiterJobs(recruiterId);
      setJobs(result);
    } finally {
      setLoading(false);
    }
  }, []);

  return { jobs, loading, fetchJobs };
}
