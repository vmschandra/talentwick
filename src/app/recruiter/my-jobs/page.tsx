"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getRecruiterJobs, updateJob, deleteJob } from "@/lib/firebase/firestore";
import { Job, JobStatus } from "@/types";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Briefcase,
  Users,
  Eye,
  MoreVertical,
  Edit,
  Pause,
  Play,
  XCircle,
  Trash2,
  PlusCircle,
} from "lucide-react";

const statusVariant: Record<JobStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  draft: "secondary",
  active: "success",
  paused: "warning",
  closed: "destructive",
  expired: "secondary",
};

const statusTabs: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "closed", label: "Closed" },
  { value: "expired", label: "Expired" },
];

export default function MyJobsPage() {
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchJobs() {
      try {
        const data = await getRecruiterJobs(user!.uid);
        setJobs(data);
      } catch (error) {
        toast.error("Failed to load your jobs");
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [user, authLoading]);

  async function handleStatusChange(job: Job, newStatus: JobStatus) {
    try {
      await updateJob(job.id, { status: newStatus });
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j))
      );
      toast.success(`Job ${newStatus === "active" ? "activated" : newStatus}`);
    } catch (error) {
      toast.error("Failed to update job status");
    }
  }

  async function handleDelete() {
    if (!jobToDelete) return;
    setDeleting(true);

    try {
      await deleteJob(jobToDelete.id);
      setJobs((prev) => prev.filter((j) => j.id !== jobToDelete.id));
      toast.success("Job deleted successfully");
    } catch (error) {
      toast.error("Failed to delete job");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  }

  const filteredJobs =
    activeTab === "all" ? jobs : jobs.filter((j) => j.status === activeTab);

  if (authLoading || loading) {
    return <MyJobsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Jobs</h1>
          <p className="text-muted-foreground">{jobs.length} total job posting{jobs.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/recruiter/post-job">
            <PlusCircle className="mr-2 h-4 w-4" /> Post a Job
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {tab.value === "all" ? (
                <span className="ml-1.5 text-xs text-muted-foreground">({jobs.length})</span>
              ) : (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({jobs.filter((j) => j.status === tab.value).length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No jobs found</h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "all"
                    ? "You haven't posted any jobs yet."
                    : `No ${activeTab} jobs.`}
                </p>
                {activeTab === "all" && (
                  <Button asChild className="mt-2">
                    <Link href="/recruiter/post-job">Post Your First Job</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onStatusChange={handleStatusChange}
                  onDelete={(j) => {
                    setJobToDelete(j);
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job Posting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{jobToDelete?.title}&rdquo;? This action cannot
              be undone and all associated applicant data will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JobCard({
  job,
  onStatusChange,
  onDelete,
}: {
  job: Job;
  onStatusChange: (job: Job, status: JobStatus) => void;
  onDelete: (job: Job) => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            href={`/recruiter/my-jobs/${job.id}`}
            className="text-lg font-semibold hover:underline"
          >
            {job.title}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant={statusVariant[job.status]}>{job.status}</Badge>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {job.viewCount} view{job.viewCount !== 1 ? "s" : ""}
            </span>
            <span>{job.createdAt?.toDate ? timeAgo(job.createdAt.toDate()) : ""}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/recruiter/my-jobs/${job.id}/applicants`}>
              <Users className="mr-1.5 h-3.5 w-3.5" /> Applicants
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/recruiter/my-jobs/${job.id}`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              {job.status === "active" && (
                <DropdownMenuItem onClick={() => onStatusChange(job, "paused")}>
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </DropdownMenuItem>
              )}
              {job.status === "paused" && (
                <DropdownMenuItem onClick={() => onStatusChange(job, "active")}>
                  <Play className="mr-2 h-4 w-4" /> Activate
                </DropdownMenuItem>
              )}
              {(job.status === "active" || job.status === "paused") && (
                <DropdownMenuItem onClick={() => onStatusChange(job, "closed")}>
                  <XCircle className="mr-2 h-4 w-4" /> Close
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(job)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function MyJobsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-full max-w-lg" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
