"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAllCandidateProfiles, getAllUsers, incrementProfileView } from "@/lib/firebase/firestore";
import { CandidateProfile, UserDoc, JobType } from "@/types";
import { parseLocation, formatCurrency } from "@/lib/utils";
import { WORLD_LOCATIONS } from "@/lib/data/locations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { MapPin, Briefcase, Clock, FileText, Users, Search, X, MessageSquare } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const COUNTRIES = Object.keys(WORLD_LOCATIONS).sort();

const EXPERIENCE_OPTIONS = [
  { label: "Experience", value: "any" },
  { label: "Less than 1 year", value: "0" },
  { label: "1+ years", value: "1" },
  { label: "3+ years", value: "3" },
  { label: "5+ years", value: "5" },
  { label: "10+ years", value: "10" },
];

const JOB_TYPE_LABELS: Record<JobType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcTotalYears(experience: CandidateProfile["experience"]): number {
  if (!experience?.length) return 0;
  let totalMonths = 0;
  const now = new Date();
  for (const exp of experience) {
    const [sy, sm] = exp.startDate.split("-").map(Number);
    const start = new Date(sy, (sm || 1) - 1);
    const end =
      exp.current || !exp.endDate
        ? now
        : (() => {
            const [ey, em] = exp.endDate!.split("-").map(Number);
            return new Date(ey, (em || 1) - 1);
          })();
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    if (months > 0) totalMonths += months;
  }
  return Math.floor(totalMonths / 12);
}

interface Candidate extends CandidateProfile {
  displayName: string;
  email: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BrowseCandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [titleInput, setTitleInput] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("any");

  // Applied filters (set on Search click)
  const [activeTitle, setActiveTitle] = useState("");
  const [activeCountry, setActiveCountry] = useState("");
  const [activeCity, setActiveCity] = useState("");
  const [activeExperience, setActiveExperience] = useState("any");

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

  // Title autocomplete suggestions from real candidate data
  const titleSuggestions = useMemo(
    () =>
      Array.from(
        new Set([
          ...candidates.map((c) => c.headline).filter(Boolean),
          ...candidates.flatMap((c) => c.skills ?? []).filter(Boolean),
        ])
      ).sort() as string[],
    [candidates]
  );

  // City options based on selected country
  const cityOptions = useMemo(
    () => (country ? WORLD_LOCATIONS[country] ?? [] : []),
    [country]
  );

  // Filter results
  const filtered = useMemo(() => {
    const t = activeTitle.toLowerCase();
    const co = activeCountry.toLowerCase();
    const ci = activeCity.toLowerCase();
    const minYears = activeExperience === "any" ? -1 : parseInt(activeExperience);

    return candidates.filter((c) => {
      if (
        t &&
        !c.headline?.toLowerCase().includes(t) &&
        !c.skills?.some((s) => s.toLowerCase().includes(t))
      )
        return false;

      const loc = parseLocation(c.location ?? "");
      if (co && !loc.country.toLowerCase().includes(co)) return false;
      if (ci && !loc.city.toLowerCase().includes(ci)) return false;

      if (minYears >= 0) {
        const years = calcTotalYears(c.experience);
        if (activeExperience === "0") {
          if (years >= 1) return false;
        } else {
          if (years < minYears) return false;
        }
      }

      return true;
    });
  }, [candidates, activeTitle, activeCountry, activeCity, activeExperience]);

  const isFiltering =
    activeTitle || activeCountry || activeCity || activeExperience !== "any";

  function applySearch() {
    setActiveTitle(titleInput.trim());
    setActiveCountry(country);
    setActiveCity(city);
    setActiveExperience(experience);
  }

  function clearAll() {
    setTitleInput("");
    setCountry("");
    setCity("");
    setExperience("any");
    setActiveTitle("");
    setActiveCountry("");
    setActiveCity("");
    setActiveExperience("any");
  }

  // When country changes, reset city
  function handleCountryChange(val: string) {
    setCountry(val);
    setCity("");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Browse Candidates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {loading
            ? "Loading…"
            : `${filtered.length} candidate${filtered.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {/* Filters */}
      <form
        onSubmit={(e) => { e.preventDefault(); applySearch(); }}
        className="flex flex-col gap-3"
      >
        {/* Row 1: title + country + city */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Title / skill autocomplete */}
          <div className="relative flex-1 min-w-0">
            <SearchableSelect
              value={titleInput}
              onChange={(v) => setTitleInput(v)}
              options={titleSuggestions}
              placeholder="Job title or skill"
              className="w-full"
            />
          </div>

          {/* Country */}
          <SearchableSelect
            value={country}
            onChange={handleCountryChange}
            options={COUNTRIES}
            placeholder="Country"
            className="sm:w-48"
          />

          {/* City */}
          <SearchableSelect
            value={city}
            onChange={setCity}
            options={cityOptions}
            placeholder={country ? "City" : "Select country first"}
            disabled={!country}
            className="sm:w-48"
          />
        </div>

        {/* Row 2: experience + buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={experience} onValueChange={setExperience}>
            <SelectTrigger className="sm:w-52">
              <SelectValue placeholder="Experience" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 sm:ml-auto">
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" /> Search
            </Button>
            {isFiltering && (
              <Button type="button" variant="outline" onClick={clearAll}>
                <X className="mr-1.5 h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>
      </form>

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
          <p className="font-medium text-muted-foreground">
            {isFiltering
              ? "No candidates match your filters"
              : "No candidates available yet"}
          </p>
          {isFiltering && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const years = calcTotalYears(c.experience);
            const visibleSkills = c.skills?.slice(0, 5) ?? [];
            const extraSkills = (c.skills?.length ?? 0) - visibleSkills.length;
            const { city: locCity, country: locCountry } = parseLocation(c.location ?? "");
            const locationLabel = [locCity, locCountry].filter(Boolean).join(", ");

            return (
              <Card
                key={c.uid}
                className="flex flex-col hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5 flex flex-col gap-3 flex-1">
                  {/* Name + open badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{c.displayName}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {c.headline || "—"}
                      </p>
                    </div>
                    {c.openToWork && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-green-700 bg-green-100 border-green-200"
                      >
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
                        <Briefcase className="h-3 w-3" />{" "}
                        {JOB_TYPE_LABELS[c.preferredJobType]}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {years === 0
                        ? "< 1 yr exp"
                        : `${years} yr${years !== 1 ? "s" : ""} exp`}
                    </span>
                    {c.expectedSalary && (
                      <span>
                        {formatCurrency(c.expectedSalary.min, c.expectedSalary.currency)}–
                        {formatCurrency(c.expectedSalary.max, c.expectedSalary.currency)}
                      </span>
                    )}
                  </div>

                  {/* Skills */}
                  {visibleSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {visibleSkills.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                      {extraSkills > 0 && (
                        <Badge variant="outline" className="text-xs">
                          +{extraSkills}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        incrementProfileView(c.uid).catch(() => {});
                        router.push(
                          `/recruiter/messages?start=${c.uid}&name=${encodeURIComponent(c.displayName)}`
                        );
                      }}
                    >
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Message
                    </Button>
                    {c.resumeURL && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        asChild
                        onClick={() => incrementProfileView(c.uid).catch(() => {})}
                      >
                        <a
                          href={c.resumeURL}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="mr-1.5 h-3.5 w-3.5" /> Resume
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
