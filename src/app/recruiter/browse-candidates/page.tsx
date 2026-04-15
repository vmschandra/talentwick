"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllCandidateProfiles } from "@/lib/firebase/firestore";
import { getAllUsers } from "@/lib/firebase/firestore";
import { CandidateProfile, UserDoc, JobType } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Search,
  Briefcase,
  Clock,
  FileText,
  Users,
  X,
} from "lucide-react";


// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcTotalYears(experience: CandidateProfile["experience"]): number {
  if (!experience?.length) return 0;
  let totalMonths = 0;
  const now = new Date();
  for (const exp of experience) {
    const [sy, sm] = exp.startDate.split("-").map(Number);
    const start = new Date(sy, (sm || 1) - 1);
    let end: Date;
    if (exp.current || !exp.endDate) {
      end = now;
    } else {
      const [ey, em] = exp.endDate.split("-").map(Number);
      end = new Date(ey, (em || 1) - 1);
    }
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months > 0) totalMonths += months;
  }
  return Math.floor(totalMonths / 12);
}

function experienceLabel(years: number): string {
  if (years === 0) return "< 1 yr";
  return `${years} yr${years !== 1 ? "s" : ""}`;
}

const JOB_TYPE_LABELS: Record<JobType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
};

// ─── Location parsing ─────────────────────────────────────────────────────────
// Expects free-text like "Hyderabad", "SFO, USA", "London, UK"
function parseLocation(raw: string): { city: string; country: string } {
  if (!raw?.trim()) return { city: "", country: "" };
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { city: parts.slice(0, -1).join(", "), country: parts[parts.length - 1] };
  }
  return { city: parts[0], country: "" };
}

// ─── Merged candidate type ────────────────────────────────────────────────────
interface Candidate extends CandidateProfile {
  displayName: string;
  email: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BrowseCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState<string>("all");
  const [minExp, setMinExp] = useState<string>("0");
  const [country, setCountry] = useState<string>("all");
  const [city, setCity] = useState<string>("all");

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

  // Unique countries and cities derived from loaded candidates
  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      const { country: co } = parseLocation(c.location ?? "");
      if (co) set.add(co);
    });
    return Array.from(set).sort();
  }, [candidates]);

  // Cities narrowed to selected country (or all cities when no country selected)
  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      const { city: ci, country: co } = parseLocation(c.location ?? "");
      if (!ci) return;
      if (country === "all" || co === country) set.add(ci);
    });
    return Array.from(set).sort();
  }, [candidates, country]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return candidates.filter((c) => {
      if (jobType !== "all" && c.preferredJobType !== jobType) return false;
      const { city: ci, country: co } = parseLocation(c.location ?? "");
      if (country !== "all" && co !== country) return false;
      if (city !== "all" && ci !== city) return false;
      const years = calcTotalYears(c.experience);
      if (years < Number(minExp)) return false;
      if (q) {
        const inHeadline = c.headline?.toLowerCase().includes(q);
        const inSkills = c.skills?.some((s) => s.toLowerCase().includes(q));
        const inName = c.displayName.toLowerCase().includes(q);
        if (!inHeadline && !inSkills && !inName) return false;
      }
      return true;
    });
  }, [candidates, search, jobType, minExp, country, city]);

  const hasFilters = search || jobType !== "all" || minExp !== "0" || country !== "all" || city !== "all";

  function clearFilters() {
    setSearch("");
    setJobType("all");
    setMinExp("0");
    setCountry("all");
    setCity("all");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Browse Candidates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading…" : `${filtered.length} candidate${filtered.length !== 1 ? "s" : ""} found`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, headline or skill…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Country */}
            <Select
              value={country}
              onValueChange={(val) => { setCountry(val); setCity("all"); }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countryOptions.map((co) => (
                  <SelectItem key={co} value={co}>{co}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* City */}
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="w-40">
                <MapPin className="mr-1 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cities</SelectItem>
                {cityOptions.map((ci) => (
                  <SelectItem key={ci} value={ci}>{ci}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Job type */}
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All job types</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
              </SelectContent>
            </Select>

            {/* Min experience */}
            <Select value={minExp} onValueChange={setMinExp}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Experience</SelectItem>
                <SelectItem value="1">1+ years</SelectItem>
                <SelectItem value="3">3+ years</SelectItem>
                <SelectItem value="5">5+ years</SelectItem>
                <SelectItem value="10">10+ years</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear */}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 gap-1 text-muted-foreground">
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No candidates match your filters</p>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const years = calcTotalYears(c.experience);
            const visibleSkills = c.skills?.slice(0, 5) ?? [];
            const extraSkills = (c.skills?.length ?? 0) - visibleSkills.length;

            return (
              <Card key={c.uid} className="flex flex-col hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col gap-3 flex-1">
                  {/* Name + open-to-work */}
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

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    {c.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {c.location}
                      </span>
                    )}
                    {c.preferredJobType && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> {JOB_TYPE_LABELS[c.preferredJobType]}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {experienceLabel(years)} exp
                    </span>
                    {c.expectedSalary && (
                      <span>
                        {formatCurrency(c.expectedSalary.min, c.expectedSalary.currency)}
                        {" – "}
                        {formatCurrency(c.expectedSalary.max, c.expectedSalary.currency)}
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

                  {/* Resume link */}
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
