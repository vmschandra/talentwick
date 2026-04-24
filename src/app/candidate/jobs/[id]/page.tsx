"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  getJob,
  hasApplied,
  applyToJob,
  getCandidateProfile,
  incrementJobView,
} from "@/lib/firebase/firestore";
import { Job, CandidateProfile } from "@/types";
import { formatDate, formatCurrency, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { triggerEmail } from "@/lib/email/send-client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import ResumeUploader from "@/components/shared/ResumeUploader";
import {
  MapPin,
  Clock,
  DollarSign,
  Building,
  Users,
  Eye,
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  FileText,
  Globe,
  Award,
} from "lucide-react";

function JobDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-10 w-3/4" />
      <div className="flex gap-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  );
}

export default function JobDetailPage() {
  const { user, userDoc, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applicationResumeURL, setApplicationResumeURL] = useState("");
  const [applicationResumeFileName, setApplicationResumeFileName] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || !userDoc) {
      router.push("/login");
      return;
    }

    async function fetchData() {
      try {
        const [jobData, profileData, alreadyApplied] = await Promise.all([
          getJob(jobId),
          getCandidateProfile(user!.uid),
          hasApplied(jobId, user!.uid),
        ]);

        if (!jobData) {
          toast.error("Job not found.");
          router.push("/candidate/jobs");
          return;
        }

        setJob(jobData);
        setProfile(profileData);
        setApplied(alreadyApplied);

        // Pre-fill resume from profile
        if (profileData?.resumeURL) {
          setApplicationResumeURL(profileData.resumeURL);
          setApplicationResumeFileName(profileData.resumeFileName || "Resume");
        }

        // Increment view count
        incrementJobView(jobId).catch(() => {
          // Non-critical, ignore errors
        });
      } catch {
        toast.error("Failed to load job details.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [jobId, user, userDoc, authLoading, router]);

  const handleApply = async () => {
    if (!user || !userDoc || !job) return;

    if (!applicationResumeURL) {
      toast.error("Please upload a resume before applying.");
      return;
    }

    setApplying(true);
    try {
      await applyToJob({
        jobId: job.id,
        candidateId: user.uid,
        recruiterId: job.recruiterId,
        candidateName: userDoc.displayName || "Candidate",
        candidateEmail: userDoc.email,
        resumeURL: applicationResumeURL,
        coverLetter: coverLetter.trim() || undefined,
      });

      setApplied(true);
      setShowApplyDialog(false);
      toast.success("Application submitted successfully!");
      // Fire-and-forget notification email to recruiter
      user.getIdToken().then((token) =>
        triggerEmail(token, {
          type: "application_received",
          jobId: job!.id,
          jobTitle: job!.title,
          candidateName: userDoc.displayName || "Candidate",
          recruiterId: job!.recruiterId,
        })
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit application.";
      toast.error(message);
    } finally {
      setApplying(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <JobDetailSkeleton />
      </div>
    );
  }

  if (!job || !user || !userDoc) return null;

  const isExpired =
    job.applicationDeadline && job.applicationDeadline.toDate() < new Date();
  const isClosed = job.status !== "active";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/candidate/jobs">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {job.title}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              <Building className="h-4 w-4 shrink-0" />
              <span className="text-lg">{job.companyName}</span>
            </div>
          </div>

          {/* Apply Button */}
          <div className="shrink-0">
            {applied ? (
              <Button disabled variant="outline" size="lg">
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Applied
              </Button>
            ) : isClosed || isExpired ? (
              <Button disabled variant="outline" size="lg">
                {isExpired ? "Deadline Passed" : "Position Closed"}
              </Button>
            ) : (
              <Button size="lg" onClick={() => setShowApplyDialog(true)}>
                <Send className="mr-2 h-4 w-4" /> Apply Now
              </Button>
            )}
          </div>
        </div>

        {/* Meta Tags */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> {job.location}
          </span>
          <Badge variant="outline">{job.jobType}</Badge>
          <Badge variant="outline">
            <Globe className="mr-1 h-3 w-3" /> {job.workMode}
          </Badge>
          <Badge variant="outline">
            <Award className="mr-1 h-3 w-3" /> {job.experienceLevel}
          </Badge>
          {job.isFeatured && <Badge variant="warning">Featured</Badge>}
        </div>

        {/* Salary */}
        {job.salary && (
          <p className="mt-3 flex items-center gap-1.5 text-lg font-semibold text-green-700">
            <DollarSign className="h-5 w-5" />
            {formatCurrency(job.salary.min, job.salary.currency)} -{" "}
            {formatCurrency(job.salary.max, job.salary.currency)} / {job.salary.period}
          </p>
        )}

        {/* Stats */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Posted{" "}
            {job.createdAt ? timeAgo(job.createdAt.toDate()) : "recently"}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {job.viewCount} view{job.viewCount !== 1 ? "s" : ""}
          </span>
          {job.applicationDeadline && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Deadline: {formatDate(job.applicationDeadline.toDate())}
            </span>
          )}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Content */}
      <div className="space-y-8">
        {/* Description */}
        <section>
          <h2 className="text-xl font-semibold mb-3">About the Role</h2>
          <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
            {job.description}
          </p>
        </section>

        {/* Responsibilities */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Responsibilities</h2>
            <ul className="space-y-2">
              {job.responsibilities.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-muted-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Requirements</h2>
            <ul className="space-y-2">
              {job.requirements.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-muted-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Benefits</h2>
            <ul className="space-y-2">
              {job.benefits.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-muted-foreground"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Sticky Apply Bar (bottom) for mobile */}
      {!applied && !isClosed && !isExpired && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 sm:hidden">
          <Button
            className="w-full"
            size="lg"
            onClick={() => setShowApplyDialog(true)}
          >
            <Send className="mr-2 h-4 w-4" /> Apply Now
          </Button>
        </div>
      )}

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply to {job.title}</DialogTitle>
            <DialogDescription>
              at {job.companyName}. Review your details and submit your application.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Resume Section */}
            <div className="space-y-2">
              <Label>Resume</Label>
              {applicationResumeURL ? (
                <div className="flex items-center gap-3 rounded-md border p-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="flex-1 text-sm truncate">
                    {applicationResumeFileName || "Resume from profile"}
                  </span>
                  <Badge variant="success" className="text-xs">
                    Ready
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-2">
                  No resume found on your profile. Please upload one.
                </p>
              )}
              <ResumeUploader
                uid={user.uid}
                currentUrl={applicationResumeURL || undefined}
                currentFileName={applicationResumeFileName || undefined}
                onUploaded={(url, fileName) => {
                  setApplicationResumeURL(url);
                  setApplicationResumeFileName(fileName);
                }}
              />
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
                maxLength={3000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {coverLetter.length}/3000
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApplyDialog(false)}
              disabled={applying}
            >
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={applying || !applicationResumeURL}>
              {applying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Submit Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
