"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getJob, updateJob } from "@/lib/firebase/firestore";
import { Job, JobType, WorkMode, ExperienceLevel } from "@/types";
import { WORLD_LOCATIONS } from "@/lib/data/locations";
import { parseLocation } from "@/lib/utils";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Plus,
  X,
  ArrowLeft,
  Users,
  Play,
  Pause,
  XCircle,
  Eye,
} from "lucide-react";

const jobTypes: { value: JobType; label: string }[] = [
  { value: "full-time", label: "Full Time" },
  { value: "part-time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

const workModes: { value: WorkMode; label: string }[] = [
  { value: "onsite", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

const experienceLevels: { value: ExperienceLevel; label: string }[] = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executive" },
];

const currencies = ["USD", "EUR", "GBP", "INR", "CAD", "AUD"];
const salaryPeriods = ["yearly", "monthly", "hourly"] as const;

const editJobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(50, "Description must be at least 50 characters").max(5000),
  requirements: z.array(z.object({ value: z.string().min(1, "Cannot be empty") })).min(1),
  responsibilities: z.array(z.object({ value: z.string().min(1, "Cannot be empty") })).min(1),
  skills: z.string().min(1, "Add at least one skill"),
  location: z.string().min(2, "Location is required"),
  jobType: z.enum(["full-time", "part-time", "contract", "internship"]),
  workMode: z.enum(["onsite", "remote", "hybrid"]),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead", "executive"]),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  salaryCurrency: z.string().default("USD"),
  salaryPeriod: z.enum(["yearly", "monthly", "hourly"]).default("yearly"),
  benefits: z.array(z.object({ value: z.string() })).optional(),
  applicationDeadline: z.string().optional(),
}).refine(
  (d) => !d.salaryMin || !d.salaryMax || d.salaryMax >= d.salaryMin,
  { message: "Max salary must be greater than or equal to min salary", path: ["salaryMax"] }
);

type EditJobFormData = z.infer<typeof editJobSchema>;

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [locationCountry, setLocationCountry] = useState("");
  const [locationCity, setLocationCity] = useState("");

  const COUNTRIES = Object.keys(WORLD_LOCATIONS).sort();

  function handleCountryChange(country: string) {
    setLocationCountry(country);
    setLocationCity("");
    setValue("location", country, { shouldValidate: true });
  }

  function handleCityChange(city: string) {
    setLocationCity(city);
    const combined = city && locationCountry ? `${city}, ${locationCountry}` : locationCountry || city;
    setValue("location", combined, { shouldValidate: true });
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditJobFormData>({
    // @ts-expect-error -- TS2719: @hookform/resolvers v5 ships its own Resolver type that
    // is structurally identical to but unrelated from react-hook-form's Resolver type.
    resolver: zodResolver(editJobSchema),
    defaultValues: {
      requirements: [{ value: "" }],
      responsibilities: [{ value: "" }],
      benefits: [{ value: "" }],
      salaryCurrency: "USD",
      salaryPeriod: "yearly",
    },
  });

  const {
    fields: requirementFields,
    append: addRequirement,
    remove: removeRequirement,
  } = useFieldArray({ control, name: "requirements" });

  const {
    fields: responsibilityFields,
    append: addResponsibility,
    remove: removeResponsibility,
  } = useFieldArray({ control, name: "responsibilities" });

  const {
    fields: benefitFields,
    append: addBenefit,
    remove: removeBenefit,
  } = useFieldArray({ control, name: "benefits" });

  const watchedJobType = watch("jobType");
  const watchedWorkMode = watch("workMode");
  const watchedExperienceLevel = watch("experienceLevel");
  const watchedSalaryCurrency = watch("salaryCurrency");
  const watchedSalaryPeriod = watch("salaryPeriod");

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchJob() {
      try {
        const data = await getJob(jobId);
        if (!data) {
          toast.error("Job not found");
          router.push("/recruiter/my-jobs");
          return;
        }

        if (data.recruiterId !== user!.uid) {
          toast.error("Unauthorized");
          router.push("/recruiter/my-jobs");
          return;
        }

        setJob(data);

        const deadlineStr = data.applicationDeadline?.toDate
          ? data.applicationDeadline.toDate().toISOString().split("T")[0]
          : "";

        reset({
          title: data.title,
          description: data.description,
          requirements: data.requirements.map((r) => ({ value: r })),
          responsibilities: data.responsibilities.map((r) => ({ value: r })),
          skills: data.skills.join(","),
          location: data.location,
          jobType: data.jobType,
          workMode: data.workMode,
          experienceLevel: data.experienceLevel,
          salaryMin: data.salary?.min,
          salaryMax: data.salary?.max,
          salaryCurrency: data.salary?.currency?.toUpperCase() || "USD",
          salaryPeriod: data.salary?.period || "yearly",
          benefits: data.benefits?.length ? data.benefits.map((b) => ({ value: b })) : [{ value: "" }],
          applicationDeadline: deadlineStr,
        });

        setSkillTags(data.skills || []);

        // Pre-populate country/city dropdowns from stored "City, Country" string
        const { city, country } = parseLocation(data.location ?? "");
        setLocationCountry(country || data.location || "");
        setLocationCity(country ? city : "");
      } catch {
        toast.error("Failed to load job details");
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [user, authLoading, jobId, router, reset]);

  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && skillInput.trim()) {
      e.preventDefault();
      const newSkill = skillInput.trim().replace(/,$/, "");
      if (newSkill && !skillTags.includes(newSkill)) {
        const updated = [...skillTags, newSkill];
        setSkillTags(updated);
        setValue("skills", updated.join(","), { shouldValidate: true });
      }
      setSkillInput("");
    }
  }

  function removeSkill(skill: string) {
    const updated = skillTags.filter((s) => s !== skill);
    setSkillTags(updated);
    setValue("skills", updated.join(","), { shouldValidate: true });
  }

  async function handleStatusChange(newStatus: "active" | "paused" | "closed") {
    if (!job) return;
    setStatusUpdating(true);

    try {
      await updateJob(job.id, { status: newStatus });
      setJob({ ...job, status: newStatus });
      toast.success(`Job ${newStatus === "active" ? "activated" : newStatus}`);
    } catch {
      toast.error("Failed to update job status");
    } finally {
      setStatusUpdating(false);
    }
  }

  async function onSubmit(data: EditJobFormData) {
    if (!job) return;

    // Flush any skill typed in the input but not yet confirmed with Enter.
    const pendingSkill = skillInput.trim();
    const finalSkills =
      pendingSkill && !skillTags.includes(pendingSkill)
        ? [...skillTags, pendingSkill]
        : skillTags;

    setSaving(true);

    try {
      const salary =
        data.salaryMin && data.salaryMax
          ? {
              min: data.salaryMin,
              max: data.salaryMax,
              currency: data.salaryCurrency.toLowerCase(),
              period: data.salaryPeriod as "yearly" | "monthly" | "hourly",
            }
          : undefined;

      const deadline = data.applicationDeadline
        ? Timestamp.fromDate(new Date(data.applicationDeadline))
        : undefined;

      await updateJob(job.id, {
        title: data.title,
        description: data.description,
        requirements: data.requirements.map((r) => r.value).filter(Boolean),
        responsibilities: data.responsibilities.map((r) => r.value).filter(Boolean),
        skills: finalSkills,
        location: data.location,
        jobType: data.jobType,
        workMode: data.workMode,
        experienceLevel: data.experienceLevel,
        salary,
        benefits: data.benefits?.map((b) => b.value).filter(Boolean) || [],
        applicationDeadline: deadline,
      });

      toast.success("Job updated successfully");
    } catch {
      toast.error("Failed to update job");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return <EditJobSkeleton />;
  }

  if (!job) return null;

  const statusVariant = {
    draft: "secondary" as const,
    active: "success" as const,
    paused: "warning" as const,
    closed: "destructive" as const,
    expired: "secondary" as const,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/recruiter/my-jobs")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <Badge variant={statusVariant[job.status]}>{job.status}</Badge>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {job.viewCount} view{job.viewCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/recruiter/my-jobs/${job.id}/applicants`}>
              <Users className="mr-1.5 h-3.5 w-3.5" /> View Applicants
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {job.status === "active" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("paused")}
                disabled={statusUpdating}
              >
                <Pause className="mr-1.5 h-3.5 w-3.5" /> Pause
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("closed")}
                disabled={statusUpdating}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" /> Close
              </Button>
            </>
          )}
          {job.status === "paused" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("active")}
                disabled={statusUpdating}
              >
                <Play className="mr-1.5 h-3.5 w-3.5" /> Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("closed")}
                disabled={statusUpdating}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" /> Close
              </Button>
            </>
          )}
          {job.status === "closed" && (
            <p className="text-sm text-muted-foreground">
              This job is closed and no longer accepting applications.
            </p>
          )}
          {job.status === "expired" && (
            <p className="text-sm text-muted-foreground">
              This job has expired. Repost it to make it active again.
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Edit Form */}
      {/* @ts-expect-error -- TS2719 resolver type mismatch; see useForm comment */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea id="description" rows={8} {...register("description")} />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Location *</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <SearchableSelect
                  value={locationCountry}
                  onChange={handleCountryChange}
                  options={COUNTRIES}
                  placeholder="Search country…"
                />
                <SearchableSelect
                  value={locationCity}
                  onChange={handleCityChange}
                  options={locationCountry ? (WORLD_LOCATIONS[locationCountry] ?? []) : []}
                  placeholder={locationCountry ? "Search city…" : "Select country first"}
                  disabled={!locationCountry}
                />
              </div>
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Job Type</Label>
                <Select
                  value={watchedJobType}
                  onValueChange={(v) => setValue("jobType", v as JobType, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((jt) => (
                      <SelectItem key={jt.value} value={jt.value}>{jt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Work Mode</Label>
                <Select
                  value={watchedWorkMode}
                  onValueChange={(v) => setValue("workMode", v as WorkMode, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workModes.map((wm) => (
                      <SelectItem key={wm.value} value={wm.value}>{wm.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select
                  value={watchedExperienceLevel}
                  onValueChange={(v) => setValue("experienceLevel", v as ExperienceLevel, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((el) => (
                      <SelectItem key={el.value} value={el.value}>{el.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requirementFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input {...register(`requirements.${index}.value`)} />
                {requirementFields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRequirement(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addRequirement({ value: "" })}>
              <Plus className="mr-1 h-4 w-4" /> Add Requirement
            </Button>
          </CardContent>
        </Card>

        {/* Responsibilities */}
        <Card>
          <CardHeader>
            <CardTitle>Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {responsibilityFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input {...register(`responsibilities.${index}.value`)} />
                {responsibilityFields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeResponsibility(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addResponsibility({ value: "" })}>
              <Plus className="mr-1 h-4 w-4" /> Add Responsibility
            </Button>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Type a skill and press Enter to add</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="e.g., React, TypeScript"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
            />
            {errors.skills && <p className="text-sm text-destructive">{errors.skills.message}</p>}
            {skillTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skillTags.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="ml-1 rounded-full hover:bg-muted">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary */}
        <Card>
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>Min Salary</Label>
                <Input type="number" {...register("salaryMin")} />
              </div>
              <div className="space-y-2">
                <Label>Max Salary</Label>
                <Input type="number" {...register("salaryMax")} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={watchedSalaryCurrency} onValueChange={(v) => setValue("salaryCurrency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={watchedSalaryPeriod} onValueChange={(v) => setValue("salaryPeriod", v as typeof salaryPeriods[number])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {salaryPeriods.map((p) => (
                      <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {benefitFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input {...register(`benefits.${index}.value`)} />
                {benefitFields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeBenefit(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => addBenefit({ value: "" })}>
              <Plus className="mr-1 h-4 w-4" /> Add Benefit
            </Button>
          </CardContent>
        </Card>

        {/* Deadline */}
        <Card>
          <CardHeader>
            <CardTitle>Application Deadline</CardTitle>
          </CardHeader>
          <CardContent>
            <Input type="date" {...register("applicationDeadline")} className="max-w-xs" />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving} size="lg">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.push("/recruiter/my-jobs")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function EditJobSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
      </div>
      <Skeleton className="h-24 w-full" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
