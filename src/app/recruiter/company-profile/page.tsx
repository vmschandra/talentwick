"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getRecruiterProfile, saveRecruiterProfile } from "@/lib/firebase/firestore";
import { uploadCompanyLogo } from "@/lib/firebase/storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { CompanySize } from "@/types";
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
import { Building2, Upload, Loader2 } from "lucide-react";

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
    .transform((v) => normalizeUrl(v || ""))
    .refine(
      (v) => v === "" || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v),
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
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function CompanyProfilePage() {
  const { user, userDoc, loading: authLoading } = useAuth();
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
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema) as any,
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
          });
          setLogoURL(profile.companyLogo);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
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

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploading(true);
    try {
      const url = await uploadCompanyLogo(user.uid, file);
      setLogoURL(url);
      await saveRecruiterProfile(user.uid, { companyLogo: url });
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Failed to upload logo:", error);
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
        companyLogo: logoURL,
      });

      // Mark onboarding complete if first time
      if (userDoc && !userDoc.onboardingComplete) {
        await updateDoc(doc(db, "users", user.uid), {
          onboardingComplete: true,
          updatedAt: serverTimestamp(),
        });
      }

      toast.success("Company profile saved successfully");
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
        <p className="text-muted-foreground">
          {userDoc?.onboardingComplete
            ? "Update your company information"
            : "Set up your company profile to start posting jobs"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
          <CardDescription>Upload your company logo (max 2MB)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={logoURL} alt="Company logo" />
              <AvatarFallback>
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {uploading ? "Uploading..." : "Upload Logo"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>This information will appear on your job postings</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="Acme Inc."
                {...register("companyName")}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyWebsite">Company Website</Label>
              <Input
                id="companyWebsite"
                placeholder="https://www.example.com"
                {...register("companyWebsite")}
              />
              {errors.companyWebsite && (
                <p className="text-sm text-destructive">{errors.companyWebsite.message}</p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Company Size *</Label>
                <Select
                  value={watchedSize}
                  onValueChange={(v) => setValue("companySize", v as CompanySize, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size} employees
                      </SelectItem>
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
                  onValueChange={(v) => setValue("industry", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.industry && (
                  <p className="text-sm text-destructive">{errors.industry.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="San Francisco, CA"
                {...register("location")}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyDescription">Company Description *</Label>
              <Textarea
                id="companyDescription"
                placeholder="Tell candidates about your company, culture, and mission..."
                rows={5}
                {...register("companyDescription")}
              />
              {errors.companyDescription && (
                <p className="text-sm text-destructive">{errors.companyDescription.message}</p>
              )}
            </div>

            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-80" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
