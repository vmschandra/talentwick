"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getCandidateProfile, saveCandidateProfile } from "@/lib/firebase/firestore";
import { calculateProfileCompleteness, parseLocation } from "@/lib/utils";
import { WORLD_LOCATIONS } from "@/lib/data/locations";
import { CandidateProfile, Experience, Education, JobType } from "@/types";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ResumeUploader from "@/components/shared/ResumeUploader";
import {
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  FileText,
  Save,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

// ─── World location data ────────────────────────────────────
const COUNTRIES = Object.keys(WORLD_LOCATIONS).sort();

// ─── Schema ────────────────────────────────────────────────
const basicInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be under 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be under 50 characters"),
  headline: z.string().max(120, "Headline must be under 120 characters").optional(),
  summary: z.string().max(2000, "Summary must be under 2000 characters").optional(),
  location: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  preferredJobType: z.enum(["full-time", "part-time", "contract", "internship"]).optional(),
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

// ─── Blank Templates ───────────────────────────────────────
const blankExperience: Experience = {
  title: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
};

const blankEducation: Education = {
  degree: "",
  institution: "",
  fieldOfStudy: "",
  startYear: new Date().getFullYear(),
  endYear: undefined,
};

// ─── Date Picker Helpers ───────────────────────────────────
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1969 + 2 }, (_, i) => CURRENT_YEAR + 1 - i);

/** Month + Year picker that stores values as "YYYY-MM" strings. */
function MonthYearPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const parts = value ? value.split("-") : [];
  const selectedYear = parts[0] ? parseInt(parts[0]) : 0;
  const selectedMonth = parts[1] ? parseInt(parts[1]) : 0;

  function emit(y: number, m: number) {
    if (y && m) onChange(`${y}-${String(m).padStart(2, "0")}`);
    else if (y) onChange(`${y}-${String(selectedMonth || 1).padStart(2, "0")}`);
    else if (m) onChange(`${selectedYear || CURRENT_YEAR}-${String(m).padStart(2, "0")}`);
  }

  return (
    <div className="flex gap-2">
      <Select value={selectedMonth ? String(selectedMonth) : ""} onValueChange={(m) => emit(selectedYear, parseInt(m))} disabled={disabled}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((name, i) => (
            <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedYear ? String(selectedYear) : ""} onValueChange={(y) => emit(parseInt(y), selectedMonth)} disabled={disabled}>
        <SelectTrigger className="w-[105px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Year-only picker (for education). */
function YearPicker({
  value,
  onChange,
  placeholder = "Year",
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <Select value={value ? String(value) : ""} onValueChange={(v) => onChange(v ? parseInt(v) : undefined)}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {YEARS.map((y) => (
          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Searchable dropdown ───────────────────────────────────
function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
}) {
  const [inputText, setInputText] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Keep display text in sync when external value changes
  useEffect(() => { setInputText(value); }, [value]);

  const filtered = useMemo(() => {
    if (!inputText.trim()) return options;
    const q = inputText.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [inputText, options]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setInputText(value); // restore selected value on outside-click
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [value]);

  return (
    <div ref={wrapRef} className="relative">
      <Input
        value={inputText}
        onChange={(e) => { setInputText(e.target.value); setOpen(true); }}
        onFocus={() => { setInputText(""); setOpen(true); }}
        placeholder={placeholder}
        disabled={disabled}
        className={value ? "pr-7" : ""}
        autoComplete="off"
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => { onChange(""); setInputText(""); setOpen(false); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {filtered.slice(0, 100).map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt);
                setInputText(opt);
                setOpen(false);
              }}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-full max-w-xs" />
      <Skeleton className="h-6 w-full" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[200px] rounded-lg" />
      ))}
    </div>
  );
}

export default function CandidateProfilePage() {
  const { user, userDoc, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localDirty, setLocalDirty] = useState(false);
  const profileLoadedRef = useRef(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [resumeURL, setResumeURL] = useState<string | undefined>();
  const [resumeFileName, setResumeFileName] = useState<string | undefined>();
  const [openToWork, setOpenToWork] = useState(true);
  const [locationCountry, setLocationCountry] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      headline: "",
      summary: "",
      location: "",
      phone: "",
      preferredJobType: "full-time",
    },
  });

  const watchedValues = watch();

  // Mark dirty whenever any RHF-managed field changes, but only after the
  // profile has finished loading (prevents the initial reset() from triggering it).
  const { firstName, lastName, headline, summary, location, phone, preferredJobType } = watchedValues;
  useEffect(() => {
    if (!profileLoadedRef.current) return;
    setLocalDirty(true);
  }, [firstName, lastName, headline, summary, location, phone, preferredJobType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalculate completeness whenever relevant state changes
  const recalcCompleteness = useCallback(() => {
    const data: Record<string, unknown> = {
      headline: watchedValues.headline,
      summary: watchedValues.summary,
      skills,
      experience: experiences,
      education: educations,
      resumeURL,
    };
    setProfileCompleteness(calculateProfileCompleteness(data));
  }, [watchedValues.headline, watchedValues.summary, skills, experiences, educations, resumeURL]);

  useEffect(() => {
    recalcCompleteness();
  }, [recalcCompleteness]);

  // Load existing profile
  useEffect(() => {
    if (authLoading) return;
    if (!user || !userDoc) {
      router.push("/login");
      return;
    }

    async function loadProfile() {
      try {
        const existing = await getCandidateProfile(user!.uid);

        // Split displayName into first/last
        const displayName = userDoc?.displayName?.trim() || "";
        const spaceIdx = displayName.indexOf(" ");
        const firstName = spaceIdx === -1 ? displayName : displayName.slice(0, spaceIdx);
        const lastName = spaceIdx === -1 ? "" : displayName.slice(spaceIdx + 1);

        // Reset with loaded values so RHF's baseline matches saved data (isDirty = false)
        reset({
          firstName,
          lastName,
          headline: existing?.headline || "",
          summary: existing?.summary || "",
          location: existing?.location || "",
          phone: userDoc?.phone || "",
          preferredJobType: existing?.preferredJobType || "full-time",
        });

        if (existing) {
          setSkills(existing.skills || []);
          setExperiences(existing.experience || []);
          setEducations(existing.education || []);
          setResumeURL(existing.resumeURL);
          setResumeFileName(existing.resumeFileName);
          setOpenToWork(existing.openToWork ?? true);

          // Parse stored "City, Country" into the two dropdowns
          const raw = existing.location || "";
          const { city, country } = parseLocation(raw);
          // Handle edge case where only a country name was stored (no comma)
          if (!country && COUNTRIES.includes(city)) {
            setLocationCountry(city);
            setLocationCity("");
          } else {
            setLocationCountry(country);
            setLocationCity(city);
          }
        }
      } catch {
        toast.error("Failed to load profile data.");
      } finally {
        setLoading(false);
        profileLoadedRef.current = true;
      }
    }

    loadProfile();
  }, [user, userDoc, authLoading, router, setValue]);

  // ─── Dirty tracking for non-RHF state ────────────────────
  const markLocalDirty = useCallback(() => {
    if (profileLoadedRef.current) setLocalDirty(true);
  }, []);

  // ─── Location Handlers ───────────────────────────────────
  const handleCountryChange = (country: string) => {
    setLocationCountry(country);
    setLocationCity("");
    setValue("location", country);
    markLocalDirty();
  };

  const handleCityChange = (city: string) => {
    setLocationCity(city);
    const combined = city && locationCountry
      ? `${city}, ${locationCountry}`
      : locationCountry || city;
    setValue("location", combined);
    markLocalDirty();
  };

  // ─── Skills Handlers ─────────────────────────────────────
  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 30) {
      setSkills((prev) => [...prev, trimmed]);
      setSkillInput("");
      markLocalDirty();
    }
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
    markLocalDirty();
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  // ─── Experience Handlers ─────────────────────────────────
  const addExperience = () => {
    setExperiences((prev) => [...prev, { ...blankExperience }]);
    markLocalDirty();
  };

  const removeExperience = (index: number) => {
    setExperiences((prev) => prev.filter((_, i) => i !== index));
    markLocalDirty();
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | boolean) => {
    setExperiences((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp))
    );
    markLocalDirty();
  };

  // ─── Education Handlers ──────────────────────────────────
  const addEducation = () => {
    setEducations((prev) => [...prev, { ...blankEducation }]);
    markLocalDirty();
  };

  const removeEducation = (index: number) => {
    setEducations((prev) => prev.filter((_, i) => i !== index));
    markLocalDirty();
  };

  const updateEducation = (index: number, field: keyof Education, value: string | number | undefined) => {
    setEducations((prev) =>
      prev.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu))
    );
    markLocalDirty();
  };

  // ─── Save ────────────────────────────────────────────────
  const onSave = async (formData: BasicInfoFormValues) => {
    if (!user) return;

    setSaving(true);
    try {
      const profileData: Partial<CandidateProfile> = {
        headline: formData.headline || "",
        summary: formData.summary || "",
        location: formData.location || "",
        preferredJobType: (formData.preferredJobType as JobType) || "full-time",
        skills,
        experience: experiences,
        education: educations,
        resumeURL,
        resumeFileName,
        openToWork,
        profileCompleteness,
      };

      await saveCandidateProfile(user.uid, profileData);

      // Update user doc: name, phone and onboarding status
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      const userUpdates: Record<string, unknown> = {
        displayName: fullName,
        updatedAt: serverTimestamp(),
      };
      if (formData.phone !== undefined) {
        userUpdates.phone = formData.phone;
      }
      if (userDoc && !userDoc.onboardingComplete) {
        userUpdates.onboardingComplete = true;
      }
      await updateDoc(doc(db, "users", user.uid), userUpdates);

      setLocalDirty(false);
      toast.success("Profile saved successfully!");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <ProfileSkeleton />
      </div>
    );
  }

  if (!user || !userDoc) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Keep your profile up to date to attract the best opportunities.
        </p>
      </div>

      {/* Completeness Bar */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Profile Completeness</p>
            <span className="text-sm font-bold">{profileCompleteness}%</span>
          </div>
          <Progress value={profileCompleteness} className="h-2" />
          {profileCompleteness < 100 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Fill in all sections to reach 100% and improve your visibility to recruiters.
            </p>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSave)} className="space-y-8">
        {/* ─── Basic Info ──────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" /> Basic Information
            </CardTitle>
            <CardDescription>
              Your public profile details visible to recruiters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headline">Professional Headline</Label>
              <Input
                id="headline"
                placeholder="e.g. Senior Frontend Engineer | React & TypeScript"
                {...register("headline")}
              />
              {errors.headline && (
                <p className="text-sm text-destructive">{errors.headline.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Professional Summary</Label>
              <Textarea
                id="summary"
                placeholder="Write a brief summary about your experience, goals, and what you bring to the table..."
                rows={4}
                {...register("summary")}
              />
              {errors.summary && (
                <p className="text-sm text-destructive">{errors.summary.message}</p>
              )}
            </div>

            {/* Location: Country + City dropdowns */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Country</Label>
                <SearchableSelect
                  value={locationCountry}
                  onChange={handleCountryChange}
                  options={COUNTRIES}
                  placeholder="Search country…"
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <SearchableSelect
                  value={locationCity}
                  onChange={handleCityChange}
                  options={locationCountry ? (WORLD_LOCATIONS[locationCountry] ?? []) : []}
                  placeholder={locationCountry ? "Search city…" : "Select country first"}
                  disabled={!locationCountry}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="e.g. +1 (555) 123-4567"
                  {...register("phone")}
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Job Type</Label>
                <Select
                  value={watchedValues.preferredJobType || "full-time"}
                  onValueChange={(v) => setValue("preferredJobType", v as JobType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Open to Work</Label>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={openToWork}
                    onClick={() => { setOpenToWork(!openToWork); markLocalDirty(); }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      openToWork ? "bg-primary" : "bg-input"
                    }`}
                  >
                    <span
                      className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                        openToWork ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {openToWork ? "Visible to recruiters" : "Not visible"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Skills ──────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="h-5 w-5" /> Skills
            </CardTitle>
            <CardDescription>
              Add your technical and professional skills. Type and press Enter to add.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. React, TypeScript, Python..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addSkill}
                disabled={!skillInput.trim()}
              >
                Add
              </Button>
            </div>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* ─── Experience ──────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5" /> Work Experience
                </CardTitle>
                <CardDescription>
                  Add your relevant work history.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addExperience}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {experiences.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No experience added yet. Click &quot;Add&quot; to get started.
              </p>
            ) : (
              experiences.map((exp, index) => (
                <div key={index} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Experience {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExperience(index)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input
                        placeholder="e.g. Software Engineer"
                        value={exp.title}
                        onChange={(e) => updateExperience(index, "title", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        placeholder="e.g. Google"
                        value={exp.company}
                        onChange={(e) => updateExperience(index, "company", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="e.g. Mountain View, CA"
                      value={exp.location}
                      onChange={(e) => updateExperience(index, "location", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <MonthYearPicker
                        value={exp.startDate}
                        onChange={(v) => updateExperience(index, "startDate", v)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <MonthYearPicker
                        value={exp.current ? "" : exp.endDate || ""}
                        onChange={(v) => updateExperience(index, "endDate", v)}
                        disabled={exp.current}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`current-${index}`}
                      checked={exp.current}
                      onChange={(e) => {
                        updateExperience(index, "current", e.target.checked);
                        if (e.target.checked) {
                          updateExperience(index, "endDate", "");
                        }
                      }}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor={`current-${index}`} className="text-sm font-normal">
                      I currently work here
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe your responsibilities and achievements..."
                      rows={3}
                      value={exp.description}
                      onChange={(e) => updateExperience(index, "description", e.target.value)}
                    />
                  </div>

                  {index < experiences.length - 1 && <Separator />}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ─── Education ───────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5" /> Education
                </CardTitle>
                <CardDescription>
                  Add your educational background.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {educations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No education added yet. Click &quot;Add&quot; to get started.
              </p>
            ) : (
              educations.map((edu, index) => (
                <div key={index} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Education {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEducation(index)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Degree</Label>
                      <Input
                        placeholder="e.g. Bachelor of Science"
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, "degree", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input
                        placeholder="e.g. MIT"
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, "institution", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Field of Study</Label>
                    <Input
                      placeholder="e.g. Computer Science"
                      value={edu.fieldOfStudy}
                      onChange={(e) => updateEducation(index, "fieldOfStudy", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Year</Label>
                      <YearPicker
                        value={edu.startYear || undefined}
                        onChange={(v) => updateEducation(index, "startYear", v ?? 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Year</Label>
                      <YearPicker
                        value={edu.endYear}
                        onChange={(v) => updateEducation(index, "endYear", v)}
                        placeholder="Ongoing"
                      />
                    </div>
                  </div>

                  {index < educations.length - 1 && <Separator />}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* ─── Resume ──────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" /> Resume
            </CardTitle>
            <CardDescription>
              Upload your resume for easy application. PDF only, max 5MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResumeUploader
              uid={user.uid}
              currentUrl={resumeURL}
              currentFileName={resumeFileName}
              onUploaded={(url, fileName) => {
                setResumeURL(url);
                setResumeFileName(fileName);
                markLocalDirty();
              }}
            />
          </CardContent>
        </Card>

        {/* ─── Save Button ─────────────────────────────────── */}
        <div className="flex justify-end gap-3 pb-8">
          <Button type="submit" disabled={saving || !localDirty} size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
