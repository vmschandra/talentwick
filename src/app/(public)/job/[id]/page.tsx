"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  MapPin,
  Briefcase,
  Monitor,
  BarChart3,
  Clock,
  Users,
  Eye,
  DollarSign,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  FileText,
  Upload,
  Building,
  ExternalLink,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import {
  getJob,
  hasApplied,
  applyToJob,
  getCandidateProfile,
  incrementJobView,
} from "@/lib/firebase/firestore";
import { uploadResume } from "@/lib/firebase/storage";
import { Job, CandidateProfile } from "@/types";
import { siteConfig } from "@/config/site";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ─── Helpers ────────────────────────────────────────────
function formatSalary(salary: Job["salary"]) {
  if (!salary) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: salary.currency,
      maximumFractionDigits: 0,
    }).format(n);
  return `${fmt(salary.min)} - ${fmt(salary.max)} / ${salary.period}`;
}

function formatDate(timestamp: { seconds: number } | undefined) {
  if (!timestamp) return "";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Loading Skeleton ───────────────────────────────────
function JobDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Skeleton className="mb-6 h-5 w-28" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-14 w-14 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-7 w-72" />
                  <Skeleton className="h-5 w-48" />
                </div>
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Apply Modal ────────────────────────────────────────
function ApplyModal({
  job,
  candidateProfile,
  onSuccess,
}: {
  job: Job;
  candidateProfile: CandidateProfile | null;
  onSuccess: () => void;
}) {
  const { user, userDoc } = useAuth();
  const [open, setOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [useProfileResume, setUseProfileResume] = useState(
    !!candidateProfile?.resumeURL
  );
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted");
      return;
    }
    if (file.size > siteConfig.maxResumeSize) {
      toast.error("Resume must be smaller than 5MB");
      return;
    }
    setResumeFile(file);
    setUseProfileResume(false);
  }

  async function handleSubmit() {
    if (!user || !userDoc) return;

    let resumeURL = "";

    if (useProfileResume && candidateProfile?.resumeURL) {
      resumeURL = candidateProfile.resumeURL;
    } else if (resumeFile) {
      try {
        resumeURL = await uploadResume(user.uid, resumeFile);
      } catch {
        toast.error("Failed to upload resume. Please try again.");
        return;
      }
    } else {
      toast.error("Please provide a resume");
      return;
    }

    setSubmitting(true);
    try {
      await applyToJob({
        jobId: job.id,
        candidateId: user.uid,
        recruiterId: job.recruiterId,
        candidateName: userDoc.displayName,
        candidateEmail: userDoc.email,
        resumeURL,
        coverLetter: coverLetter.trim() || undefined,
      });
      toast.success("Application submitted successfully!");
      setOpen(false);
      onSuccess();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to submit application";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full gap-2">
          <FileText className="h-4 w-4" />
          Apply Now
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply to {job.title}</DialogTitle>
          <DialogDescription>
            at {job.companyName} &middot; {job.location}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Resume */}
          <div className="space-y-3">
            <Label>Resume (PDF)</Label>

            {candidateProfile?.resumeURL && (
              <div
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                  useProfileResume
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/25"
                }`}
                onClick={() => {
                  setUseProfileResume(true);
                  setResumeFile(null);
                }}
              >
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Use profile resume</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {candidateProfile.resumeFileName || "Previously uploaded resume"}
                  </p>
                </div>
                {useProfileResume && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                )}
              </div>
            )}

            <div
              className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-colors ${
                !useProfileResume && resumeFile
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/25"
              }`}
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                {resumeFile ? (
                  <>
                    <p className="text-sm font-medium">{resumeFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(resumeFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Upload a new resume
                  </p>
                )}
              </div>
              <label className="shrink-0 cursor-pointer">
                <span className="text-sm font-medium text-primary hover:underline">
                  Browse
                </span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="coverLetter">Cover Letter (optional)</Label>
            <Textarea
              id="coverLetter"
              placeholder="Tell the recruiter why you're a great fit for this role..."
              rows={5}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              {coverLetter.length}/2000 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function JobDetailPage() {
  const params = useParams();
  const { user, userDoc, loading: authLoading } = useAuth();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [candidateProfile, setCandidateProfile] =
    useState<CandidateProfile | null>(null);

  const fetchJob = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getJob(jobId);
      setJob(data);
      if (data) {
        incrementJobView(jobId).catch(() => {
          /* non-critical */
        });
      }
    } catch {
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Fetch job data
  useEffect(() => {
    if (jobId) fetchJob();
  }, [jobId, fetchJob]);

  // Check if user already applied + fetch candidate profile
  useEffect(() => {
    if (!user || !userDoc || authLoading) return;
    if (userDoc.role !== "candidate") return;

    hasApplied(jobId, user.uid).then(setAlreadyApplied).catch(() => {});
    getCandidateProfile(user.uid).then(setCandidateProfile).catch(() => {});
  }, [user, userDoc, authLoading, jobId]);

  if (loading) return <JobDetailSkeleton />;

  if (!job) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Job Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          This job posting may have been removed or the link is invalid.
        </p>
        <Link href="/browse-jobs">
          <Button variant="outline" className="mt-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Browse All Jobs
          </Button>
        </Link>
      </div>
    );
  }

  const salary = formatSalary(job.salary);
  const isCandidate = userDoc?.role === "candidate";
  const isAuthenticated = !!user && !!userDoc;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/browse-jobs"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Jobs
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Job Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xl">
                  {job.companyLogo ? (
                    <img
                      src={job.companyLogo}
                      alt={job.companyName}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : (
                    job.companyName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start gap-2">
                    <h1 className="text-2xl font-bold">{job.title}</h1>
                    {job.isFeatured && <Badge variant="warning">Featured</Badge>}
                  </div>
                  <p className="mt-1 text-muted-foreground">{job.companyName}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </Badge>
                <Badge variant="secondary" className="gap-1 capitalize">
                  <Briefcase className="h-3 w-3" />
                  {job.jobType.replace("-", " ")}
                </Badge>
                <Badge variant="secondary" className="gap-1 capitalize">
                  <Monitor className="h-3 w-3" />
                  {job.workMode}
                </Badge>
                <Badge variant="secondary" className="gap-1 capitalize">
                  <BarChart3 className="h-3 w-3" />
                  {job.experienceLevel} level
                </Badge>
              </div>

              {salary && (
                <div className="mt-4 flex items-center gap-2 text-lg font-semibold text-green-700">
                  <DollarSign className="h-5 w-5" />
                  {salary}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Posted {formatDate(job.createdAt as unknown as { seconds: number })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {job.viewCount} views
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About the Role</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {job.description}
              </p>
            </CardContent>
          </Card>

          {/* Responsibilities */}
          {job.responsibilities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {job.responsibilities.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {job.requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {job.requirements.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Benefits & Perks</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {job.benefits.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Apply Card */}
          <Card className="sticky top-4">
            <CardContent className="p-5 space-y-4">
              {alreadyApplied ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Already Applied</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      You have already submitted your application for this role.
                    </p>
                  </div>
                  <Link href="/candidate/applications" className="w-full">
                    <Button variant="outline" className="w-full gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View My Applications
                    </Button>
                  </Link>
                </div>
              ) : isAuthenticated && isCandidate ? (
                <ApplyModal
                  job={job}
                  candidateProfile={candidateProfile}
                  onSuccess={() => setAlreadyApplied(true)}
                />
              ) : isAuthenticated && !isCandidate ? (
                <div className="text-center text-sm text-muted-foreground py-2">
                  <p>Only candidates can apply for jobs.</p>
                  <p className="mt-1">
                    Signed in as a{" "}
                    <span className="font-medium capitalize">{userDoc?.role}</span>.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link href={`/login?redirect=/job/${job.id}`}>
                    <Button size="lg" className="w-full gap-2">
                      <FileText className="h-4 w-4" />
                      Apply Now
                    </Button>
                  </Link>
                  <p className="text-center text-xs text-muted-foreground">
                    Sign in or create an account to apply
                  </p>
                </div>
              )}

              {job.applicationDeadline && (
                <>
                  <Separator />
                  <p className="text-center text-sm text-muted-foreground">
                    Application deadline:{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(
                        job.applicationDeadline as unknown as { seconds: number }
                      )}
                    </span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          {job.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Required Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About the Company</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold">
                  {job.companyLogo ? (
                    <img
                      src={job.companyLogo}
                      alt={job.companyName}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    job.companyName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-medium">{job.companyName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building className="h-3.5 w-3.5" />
                    {job.location}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share / Report */}
          <Card>
            <CardContent className="p-5">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Job link copied to clipboard");
                }}
              >
                Share this Job
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
