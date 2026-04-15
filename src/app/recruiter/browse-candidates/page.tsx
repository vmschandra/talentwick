"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllCandidateProfiles, getAllUsers } from "@/lib/firebase/firestore";
import { CandidateProfile, UserDoc, JobType } from "@/types";
import { parseLocation, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { MapPin, Briefcase, Clock, FileText, Users } from "lucide-react";
import SearchBar, { SearchValues } from "@/components/shared/SearchBar";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcTotalYears(experience: CandidateProfile["experience"]): number {
  if (!experience?.length) return 0;
  let totalMonths = 0;
  const now = new Date();
  for (const exp of experience) {
    const [sy, sm] = exp.startDate.split("-").map(Number);
    const start = new Date(sy, (sm || 1) - 1);
    const end = exp.current || !exp.endDate
      ? now
      : (() => { const [ey, em] = exp.endDate!.split("-").map(Number); return new Date(ey, (em || 1) - 1); })();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months > 0) totalMonths += months;
  }
  return Math.floor(totalMonths / 12);
}

const JOB_TYPE_LABELS: Record<JobType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
};

interface Candidate extends CandidateProfile {
  displayName: string;
  email: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BrowseCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState<SearchValues>({ title: "", city: "", country: "" });

  useEffect(() => {
    async function load() {
      const [profiles, users] = await Promise.all([
        getAllCandidateProfiles(),
        getAllUsers(500),
      ]);
      const userMap = new Map<string, UserDoc>();
      for (const u of users as UserDoc[]) {
        if (u.role === "candidate") userMap.set(u.uid, u);
      }
      const merged: Candidate[] = profiles
        .filter((p) => userMap.has(p.uid))
        .map((p) => ({
          ...p,
          displayName: userMap.get(p.uid)!.displayName || "Candidate",
          email: userMap.get(p.uid)!.email || "",
        }));
      setCandidates(merged);
      setLoading(false);
    }
    load().catch(() => setLoading(false));
  }, []);

  // ── Autocomplete suggestions (derived from real candidate data) ──
  const titleSuggestions = useMemo(
    () => Array.from(new Set(candidates.map((c) => c.headline).filter(Boolean))).sort() as string[],
    [candidates]
  );
  const citySuggestions = useMemo(
    () => Array.from(new Set(candidates.map((c) => parseLocation(c.location ?? "").city).filter(Boolean))).sort() as string[],
    [candidates]
  );
  const countrySuggestions = useMemo(
    () => Array.from(new Set(candidates.map((c) => parseLocation(c.location ?? "").country).filter(Boolean))).sort() as string[],
    [candidates]
  );

  // ── Filter results ──
  const filtered = useMemo(() => {
    const t = search.title.toLowerCase();
    const ci = search.city.toLowerCase();
    const co = search.country.toLowerCase();
    return candidates.filter((c) => {
      if (t && !c.headline?.toLowerCase().includes(t) && !c.skills?.some((s) => s.toLowerCase().includes(t))) return false;
      const loc = parseLocation(c.location ?? "");
      if (ci && !loc.city.toLowerCase().includes(ci)) return false;
      if (co && !loc.country.toLowerCase().includes(co)) return false;
      return true;
    });
  }, [candidates, search]);

  const isFiltering = search.title || search.city || search.country;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Browse Candidates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {loading ? "Loading…" : `${filtered.length} candidate${filtered.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {/* Search bar */}
      <SearchBar
        titleSuggestions={titleSuggestions}
        citySuggestions={citySuggestions}
        countrySuggestions={countrySuggestions}
        onSearch={setSearch}
        titlePlaceholder="Job title or skill"
      />

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">
            {isFiltering ? "No candidates match your search" : "No candidates available yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const years = calcTotalYears(c.experience);
            const visibleSkills = c.skills?.slice(0, 5) ?? [];
            const extraSkills = (c.skills?.length ?? 0) - visibleSkills.length;
            const { city, country } = parseLocation(c.location ?? "");
            const locationLabel = [city, country].filter(Boolean).join(", ");

            return (
              <Card key={c.uid} className="flex flex-col hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col gap-3 flex-1">
                  {/* Name + open badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{c.displayName}</p>
                      <p className="text-sm text-muted-foreground truncate">{c.headline || "—"}</p>
                    </div>
                    {c.openToWork && (
                      <Badge variant="secondary" className="shrink-0 text-green-700 bg-green-100 border-green-200">
                        Open
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    {locationLabel && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {locationLabel}
                      </span>
                    )}
                    {c.preferredJobType && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> {JOB_TYPE_LABELS[c.preferredJobType]}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {years === 0 ? "< 1 yr exp" : `${years} yr${years !== 1 ? "s" : ""} exp`}
                    </span>
                    {c.expectedSalary && (
                      <span>
                        {formatCurrency(c.expectedSalary.min, c.expectedSalary.currency)}–{formatCurrency(c.expectedSalary.max, c.expectedSalary.currency)}
                      </span>
                    )}
                  </div>

                  {/* Skills */}
                  {visibleSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {visibleSkills.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                      {extraSkills > 0 && (
                        <Badge variant="outline" className="text-xs">+{extraSkills}</Badge>
                      )}
                    </div>
                  )}

                  {/* Resume */}
                  {c.resumeURL && (
                    <a
                      href={c.resumeURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" /> View Resume
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
