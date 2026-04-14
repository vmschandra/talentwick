"use client";

import { useEffect, useState } from "react";
import { getAllJobs, updateJob, deleteJob } from "@/lib/firebase/firestore";
import { Job, JobStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Trash2, Pause, Play, Eye } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

const statusVariant: Record<JobStatus, "default" | "success" | "warning" | "secondary" | "destructive"> = {
  draft: "secondary",
  active: "success",
  paused: "warning",
  closed: "secondary",
  expired: "destructive",
};

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    getAllJobs()
      .then(setJobs)
      .catch(() => toast.error("Failed to load jobs"))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (jobId: string, status: JobStatus) => {
    try {
      await updateJob(jobId, { status });
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
      toast.success(`Job ${status}`);
    } catch {
      toast.error("Failed to update job");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteJob(deleteTarget);
      setJobs((prev) => prev.filter((j) => j.id !== deleteTarget));
      toast.success("Job deleted");
    } catch {
      toast.error("Failed to delete job");
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = jobs.filter((j) => {
    const matchesSearch = !searchQuery || j.title.toLowerCase().includes(searchQuery.toLowerCase()) || j.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = tab === "all" || j.status === tab;
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Job Management</h1>
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Job Management</h1>
        <Badge variant="secondary">{jobs.length} total jobs</Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search jobs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <div className="space-y-3">
            {filtered.map((job) => (
              <Card key={job.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                      <Badge variant={statusVariant[job.status]}>{job.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {job.companyName} &middot; {job.location} &middot; {job.applicantCount} applicants &middot;
                      Posted {job.createdAt ? formatDate(job.createdAt.toDate()) : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" title="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {job.status === "active" ? (
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(job.id, "paused")} title="Pause">
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : job.status === "paused" ? (
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(job.id, "active")} title="Activate">
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(job.id)}
                      className="text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <p className="py-12 text-center text-muted-foreground">No jobs found.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this job?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The job posting and all associated data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
