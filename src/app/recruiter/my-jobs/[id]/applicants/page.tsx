"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getJob, getJobApplications, updateApplicationStatus } from "@/lib/firebase/firestore";
import { Job, Application, ApplicationStatus } from "@/types";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ApplicantCard from "@/components/cards/ApplicantCard";
import {
  ArrowLeft,
  Users,
  Clock,
  CheckCircle,
  Star,
  MessageSquare,
  Award,
  XCircle,
  Inbox,
} from "lucide-react";

const statusIcons: Record<ApplicationStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  reviewed: <CheckCircle className="h-4 w-4" />,
  shortlisted: <Star className="h-4 w-4" />,
  interview: <MessageSquare className="h-4 w-4" />,
  offered: <Award className="h-4 w-4" />,
  rejected: <XCircle className="h-4 w-4" />,
  withdrawn: <XCircle className="h-4 w-4" />,
};

export default function ApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchData() {
      try {
        const [jobData, appData] = await Promise.all([
          getJob(jobId),
          getJobApplications(jobId),
        ]);

        if (!jobData) {
          toast.error("Job not found");
          router.push("/recruiter/my-jobs");
          return;
        }

        if (jobData.recruiterId !== user!.uid) {
          toast.error("Unauthorized");
          router.push("/recruiter/my-jobs");
          return;
        }

        setJob(jobData);
        setApplications(appData);
      } catch {
        toast.error("Failed to load applicant data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user, authLoading, jobId, router]);

  async function handleStatusChange(applicationId: string, newStatus: ApplicationStatus) {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return;

    try {
      await updateApplicationStatus(applicationId, newStatus, app.candidateId);
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
      );
      toast.success(`Status updated to "${newStatus}"`);
    } catch {
      toast.error("Failed to update applicant status");
    }
  }

  if (authLoading || loading) {
    return <ApplicantsSkeleton />;
  }

  if (!job) return null;

  const statusCounts = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statuses: ApplicationStatus[] = [
    "pending",
    "reviewed",
    "shortlisted",
    "interview",
    "offered",
    "rejected",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/recruiter/my-jobs/${jobId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Applicants</h1>
            <p className="text-sm text-muted-foreground">
              {job.title} &mdash; {applications.length} applicant{applications.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/recruiter/my-jobs/${jobId}`}>Back to Job</Link>
        </Button>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statuses.map((status) => (
          <Card key={status}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="text-muted-foreground">{statusIcons[status]}</div>
              <div>
                <p className="text-xs capitalize text-muted-foreground">{status}</p>
                <p className="text-lg font-bold">{statusCounts[status] || 0}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total Stats */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <span className="text-lg font-bold">{applications.length}</span>
            <span className="ml-2 text-muted-foreground">total applicants</span>
          </div>
        </CardContent>
      </Card>

      {/* Applicant List */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No applicants yet</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Applicants will appear here once candidates apply to this job posting. Make sure your
              job is active and visible.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <ApplicantCard
              key={app.id}
              application={app}
              onStatusChange={handleStatusChange}
              showActions
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicantsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-14 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}
