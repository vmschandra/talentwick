"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getRecruiterProfile, postJobWithCredit } from "@/lib/firebase/firestore";
import { RecruiterProfile, JobType, WorkMode, ExperienceLevel } from "@/types";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Plus,
  X,
  CreditCard,
  AlertCircle,
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

const jobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title too long"),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description must be under 5000 characters"),
  requirements: z.array(z.object({ value: z.string().min(1, "Cannot be empty") })).min(1, "Add at least one requirement"),
  responsibilities: z.array(z.object({ value: z.string().min(1, "Cannot be empty") })).min(1, "Add at least one responsibility"),
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

type JobFormData = z.infer<typeof jobSchema>;

export default function PostJobPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [skillTags, setSkillTags] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JobFormData>({
    // @ts-expect-error -- TS2719: @hookform/resolvers v5 ships its own Resolver type that
    // is structurally identical to but unrelated from react-hook-form's Resolver type.
    resolver: zodResolver(jobSchema),
    defaultValues: {
      requirements: [{ value: "" }],
      responsibilities: [{ value: "" }],
      benefits: [{ value: "" }],
      salaryCurrency: "USD",
      salaryPeriod: "yearly",
      skills: "",
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

    async function loadProfile() {
      try {
        const p = await getRecruiterProfile(user!.uid);
        setProfile(p);
      } catch {
        toast.error("Failed to load your company profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, authLoading]);

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

  async function onSubmit(data: JobFormData) {
    if (!user || !profile) return;

    if ((profile.jobPostCredits || 0) < 1) {
      toast.error("No credits remaining. Please purchase credits first.");
      return;
    }

    // Flush any skill typed in the input but not yet confirmed with Enter.
    const pendingSkill = skillInput.trim();
    const finalSkills =
      pendingSkill && !skillTags.includes(pendingSkill)
        ? [...skillTags, pendingSkill]
        : skillTags;

    setSubmitting(true);

    try {
      const salary =
        data.salaryMin && data.salaryMax
          ? {
              min: data.salaryMin,
              max: data.salaryMax,
              currency: data.salaryCurrency.toLowerCase(),
              period: data.salaryPeriod,
            }
          : undefined;

      const deadline = data.applicationDeadline
        ? Timestamp.fromDate(new Date(data.applicationDeadline))
        : undefined;

      const jobId = await postJobWithCredit(user.uid, {
        recruiterId: user.uid,
        companyName: profile.companyName,
        companyLogo: profile.companyLogo,
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

      toast.success("Job posted successfully!");
      router.push(`/recruiter/my-jobs/${jobId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to post job";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return <PostJobSkeleton />;
  }

  const credits = profile?.jobPostCredits ?? 0;

  if (credits < 1) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold">No Credits Available</h2>
            <p className="max-w-md text-muted-foreground">
              You need at least 1 job posting credit to post a new job. Purchase credits to continue.
            </p>
            <Button asChild size="lg">
              <Link href="/recruiter/pricing">
                <CreditCard className="mr-2 h-4 w-4" /> Buy Credits
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Post a New Job</h1>
          <p className="text-muted-foreground">
            Fill in the details below. This will use 1 credit.
          </p>
        </div>
        <Badge variant="outline" className="h-8 px-3 text-sm">
          <CreditCard className="mr-1.5 h-3.5 w-3.5" />
          {credits} credit{credits !== 1 ? "s" : ""} remaining
        </Badge>
      </div>

      {/* @ts-expect-error -- TS2719 resolver type mismatch; see useForm comment */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input id="title" placeholder="Senior Frontend Engineer" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the role, what the team does, and what makes this opportunity exciting..."
                rows={8}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" placeholder="San Francisco, CA" {...register("location")} />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Job Type *</Label>
                <Select
                  value={watchedJobType}
                  onValueChange={(v) => setValue("jobType", v as JobType, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((jt) => (
                      <SelectItem key={jt.value} value={jt.value}>
                        {jt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.jobType && (
                  <p className="text-sm text-destructive">{errors.jobType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Work Mode *</Label>
                <Select
                  value={watchedWorkMode}
                  onValueChange={(v) => setValue("workMode", v as WorkMode, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {workModes.map((wm) => (
                      <SelectItem key={wm.value} value={wm.value}>
                        {wm.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.workMode && (
                  <p className="text-sm text-destructive">{errors.workMode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Experience Level *</Label>
                <Select
                  value={watchedExperienceLevel}
                  onValueChange={(v) =>
                    setValue("experienceLevel", v as ExperienceLevel, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((el) => (
                      <SelectItem key={el.value} value={el.value}>
                        {el.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.experienceLevel && (
                  <p className="text-sm text-destructive">{errors.experienceLevel.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements *</CardTitle>
            <CardDescription>List the qualifications candidates should have</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requirementFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder={`Requirement ${index + 1}`}
                  {...register(`requirements.${index}.value`)}
                />
                {requirementFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRequirement(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {errors.requirements && (
              <p className="text-sm text-destructive">
                {errors.requirements.message || errors.requirements.root?.message}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addRequirement({ value: "" })}
            >
              <Plus className="mr-1 h-4 w-4" /> Add Requirement
            </Button>
          </CardContent>
        </Card>

        {/* Responsibilities */}
        <Card>
          <CardHeader>
            <CardTitle>Responsibilities *</CardTitle>
            <CardDescription>Describe what the role involves day-to-day</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {responsibilityFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder={`Responsibility ${index + 1}`}
                  {...register(`responsibilities.${index}.value`)}
                />
                {responsibilityFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeResponsibility(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {errors.responsibilities && (
              <p className="text-sm text-destructive">
                {errors.responsibilities.message || errors.responsibilities.root?.message}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addResponsibility({ value: "" })}
            >
              <Plus className="mr-1 h-4 w-4" /> Add Responsibility
            </Button>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills *</CardTitle>
            <CardDescription>Type a skill and press Enter to add</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="e.g., React, TypeScript, Node.js"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
            />
            {errors.skills && (
              <p className="text-sm text-destructive">{errors.skills.message}</p>
            )}
            {skillTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skillTags.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 rounded-full hover:bg-muted"
                    >
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
            <CardDescription>Optional but recommended - jobs with salary get more applicants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>Min Salary</Label>
                <Input type="number" placeholder="50000" {...register("salaryMin")} />
              </div>
              <div className="space-y-2">
                <Label>Max Salary</Label>
                <Input type="number" placeholder="80000" {...register("salaryMax")} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={watchedSalaryCurrency}
                  onValueChange={(v) => setValue("salaryCurrency", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select
                  value={watchedSalaryPeriod}
                  onValueChange={(v) => setValue("salaryPeriod", v as typeof salaryPeriods[number])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {salaryPeriods.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
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
            <CardDescription>What perks do you offer?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {benefitFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder={`e.g., Health insurance, 401k, Remote work`}
                  {...register(`benefits.${index}.value`)}
                />
                {benefitFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBenefit(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addBenefit({ value: "" })}
            >
              <Plus className="mr-1 h-4 w-4" /> Add Benefit
            </Button>
          </CardContent>
        </Card>

        {/* Application Deadline */}
        <Card>
          <CardHeader>
            <CardTitle>Application Deadline</CardTitle>
            <CardDescription>Optional - leave blank for no deadline</CardDescription>
          </CardHeader>
          <CardContent>
            <Input type="date" {...register("applicationDeadline")} className="max-w-xs" />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} size="lg">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? "Posting..." : "Post Job (1 Credit)"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function PostJobSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-72" />
      </div>
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
