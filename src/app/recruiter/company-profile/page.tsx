"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getRecruiterProfile, saveRecruiterProfile } from "@/lib/firebase/firestore";
import { uploadCompanyLogo } from "@/lib/firebase/storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { CompanySize } from "@/types";
import { siteConfig } from "@/config/site";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Upload, Loader2, Save } from "lucide-react";

const companySizes: CompanySize[] = ["1-10", "11-50", "51-200", "201-500", "500+"];

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Media",
  "Real Estate",
  "Consulting",
  "Non-Profit",
  "Government",
  "Other",
];

function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const profileSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companyWebsite: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.trim() === "" || /^(https?:\/\/)?[^\s.]+\.[^\s]+$/i.test(v.trim()),
      "Enter a valid website (e.g. example.com)"
    ),
  companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"], {
    message: "Select a company size",
  }),
  industry: z.string().min(1, "Select an industry"),
  companyDescription: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be under 2000 characters"),
  location: z.string().min(2, "Location is required"),
  designation: z.string().min(2, "Designation is required"),
  employeeId: z.string().optional(),
  workEmail: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      "Enter a valid email address"
    ),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function CompanyProfilePage() {
  const { user, userDoc, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoURL, setLogoURL] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const watchedSize = watch("companySize");
  const watchedIndustry = watch("industry");

  useEffect(() => {
    if (authLoading || !user) return;

    async function loadProfile() {
      try {
        const profile = await getRecruiterProfile(user!.uid);
        if (profile) {
          reset({
            companyName: profile.companyName || "",
            companyWebsite: profile.companyWebsite || "",
            companySize: profile.companySize || "1-10",
            industry: profile.industry || "",
            companyDescription: profile.companyDescription || "",
            location: profile.location || "",
            designation: profile.designation || "",
            employeeId: profile.employeeId || "",
            workEmail: profile.workEmail || "",
          });
          setLogoURL(profile.companyLogo);
        }
      } catch {
        toast.error("Failed to load company profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user, authLoading, reset]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!siteConfig.allowedImageTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are accepted.");
      return;
    }
    if (file.size > siteConfig.maxImageSize) {
      toast.error(`Image must be under ${siteConfig.maxImageSize / 1024 / 1024}MB.`);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadCompanyLogo(user.uid, file);
      setLogoURL(url);
      await saveRecruiterProfile(user.uid, { companyLogo: url });
      toast.success("Logo uploaded successfully");
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: ProfileFormData) {
    if (!user) return;
    setSaving(true);

    try {
      await saveRecruiterProfile(user.uid, {
        ...data,
        companyWebsite: data.companyWebsite ? normalizeUrl(data.companyWebsite) : undefined,
        companyLogo: logoURL,
      });

      const wasOnboarding = userDoc && !userDoc.onboardingComplete;
      if (wasOnboarding) {
        await updateDoc(doc(db, "users", user.uid), {
          onboardingComplete: true,
          updatedAt: serverTimestamp(),
        });
      }

      reset(data, { keepValues: true });
      toast.success("Company profile saved successfully");

      if (wasOnboarding) {
        router.push("/recruiter/dashboard");
      }
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
        <p className="text-muted-foreground">
          {userDoc?.onboardingComplete
            ? "Update your company information"
            : "Set up your company profile to start posting jobs"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Logo + top fields row ─────────────────────────── */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Logo upload */}
              <div className="flex flex-col items-center gap-3 sm:w-36 shrink-0">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={logoURL} alt="Company logo" />
                  <AvatarFallback>
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={siteConfig.allowedImageTypes.join(",")}
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-3.5 w-3.5" />
                  )}
                  {uploading ? "Uploading…" : "Upload Logo"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
              </div>

              {/* Company name + website side by side */}
              <div className="flex-1 grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input id="companyName" placeholder="Acme Inc." {...register("companyName")} />
                  {errors.companyName && (
                    <p className="text-sm text-destructive">{errors.companyName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Company Website</Label>
                  <Input id="companyWebsite" placeholder="www.example.com" {...register("companyWebsite")} />
                  {errors.companyWebsite && (
                    <p className="text-sm text-destructive">{errors.companyWebsite.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Company Size *</Label>
                  <Select
                    value={watchedSize}
                    onValueChange={(v) => setValue("companySize", v as CompanySize, { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map((size) => (
                        <SelectItem key={size} value={size}>{size} employees</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.companySize && (
                    <p className="text-sm text-destructive">{errors.companySize.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Industry *</Label>
                  <Select
                    value={watchedIndustry}
                    onValueChange={(v) => setValue("industry", v, { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.industry && (
                    <p className="text-sm text-destructive">{errors.industry.message}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Two-column: Account Holder | Location ─────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Account Holder Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Account Holder Details</CardTitle>
              <CardDescription>Your role and identity within the company</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
                <Input id="designation" placeholder="e.g. HR Manager, Talent Acquisition Lead" {...register("designation")} />
                {errors.designation && (
                  <p className="text-sm text-destructive">{errors.designation.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input id="employeeId" placeholder="e.g. EMP-00123" {...register("employeeId")} />
                {errors.employeeId && (
                  <p className="text-sm text-destructive">{errors.employeeId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="workEmail">Official Work Email</Label>
                <Input
                  id="workEmail"
                  type="email"
                  placeholder="you@company.com"
                  {...register("workEmail")}
                />
                {errors.workEmail && (
                  <p className="text-sm text-destructive">{errors.workEmail.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location + Description */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Location & About</CardTitle>
              <CardDescription>Where you operate and what you do</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Headquarters Location *</Label>
                <Input id="location" placeholder="San Francisco, CA" {...register("location")} />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDescription">Company Description *</Label>
                <Textarea
                  id="companyDescription"
                  placeholder="Tell candidates about your company, culture, and mission…"
                  rows={5}
                  {...register("companyDescription")}
                />
                {errors.companyDescription && (
                  <p className="text-sm text-destructive">{errors.companyDescription.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Save ─────────────────────────────────────────── */}
        <div className="flex justify-end pb-6">
          <Button type="submit" disabled={saving || !isDirty} size="lg">
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> {isDirty ? "Save Profile" : "Saved"}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-80" />
      </div>
      <Skeleton className="h-52 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
