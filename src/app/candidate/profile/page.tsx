"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getCandidateProfile, saveCandidateProfile } from "@/lib/firebase/firestore";
import { calculateProfileCompleteness } from "@/lib/utils";
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
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [resumeURL, setResumeURL] = useState<string | undefined>();
  const [resumeFileName, setResumeFileName] = useState<string | undefined>();
  const [openToWork, setOpenToWork] = useState(true);
  const [profileCompleteness, setProfileCompleteness] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
        if (existing) {
          setValue("headline", existing.headline || "");
          setValue("summary", existing.summary || "");
          setValue("location", existing.location || "");
          setValue("preferredJobType", existing.preferredJobType || "full-time");
          setSkills(existing.skills || []);
          setExperiences(existing.experience || []);
          setEducations(existing.education || []);
          setResumeURL(existing.resumeURL);
          setResumeFileName(existing.resumeFileName);
          setOpenToWork(existing.openToWork ?? true);
        }
        // Pre-fill first/last name by splitting displayName on first space
        const displayName = userDoc?.displayName?.trim() || "";
        if (displayName) {
          const spaceIdx = displayName.indexOf(" ");
          if (spaceIdx === -1) {
            setValue("firstName", displayName);
          } else {
            setValue("firstName", displayName.slice(0, spaceIdx));
            setValue("lastName", displayName.slice(spaceIdx + 1));
          }
        }
        // Pre-fill phone from userDoc
        if (userDoc?.phone) {
          setValue("phone", userDoc.phone);
        }
      } catch (error) {
        toast.error("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, userDoc, authLoading, router, setValue]);

  // ─── Skills Handlers ─────────────────────────────────────
  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 30) {
      setSkills((prev) => [...prev, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
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
  };

  const removeExperience = (index: number) => {
    setExperiences((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | boolean) => {
    setExperiences((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp))
    );
  };

  // ─── Education Handlers ──────────────────────────────────
  const addEducation = () => {
    setEducations((prev) => [...prev, { ...blankEducation }]);
  };

  const removeEducation = (index: number) => {
    setEducations((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof Education, value: string | number | undefined) => {
    setEducations((prev) =>
      prev.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu))
    );
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

      toast.success("Profile saved successfully!");
    } catch (error) {
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. San Francisco, CA"
                  {...register("location")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="e.g. +1 (555) 123-4567"
                  {...register("phone")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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

              <div className="space-y-2">
                <Label>Open to Work</Label>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={openToWork}
                    onClick={() => setOpenToWork(!openToWork)}
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
                      <Input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="month"
                        value={exp.current ? "" : exp.endDate || ""}
                        onChange={(e) => updateExperience(index, "endDate", e.target.value)}
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
                      <Input
                        type="number"
                        min={1970}
                        max={2030}
                        value={edu.startYear}
                        onChange={(e) =>
                          updateEducation(index, "startYear", parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Year (leave blank if ongoing)</Label>
                      <Input
                        type="number"
                        min={1970}
                        max={2030}
                        value={edu.endYear ?? ""}
                        onChange={(e) =>
                          updateEducation(
                            index,
                            "endYear",
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
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
              }}
            />
          </CardContent>
        </Card>

        {/* ─── Save Button ─────────────────────────────────── */}
        <div className="flex justify-end gap-3 pb-8">
          <Button type="submit" disabled={saving} size="lg">
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
