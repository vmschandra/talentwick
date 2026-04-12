"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getCandidateApplications, getJob } from "@/lib/firebase/firestore";
import { Application, ApplicationStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Building, Clock } from "lucide-react";
import { timeAgo } from "@/lib/utils";

const statusColors: Record<ApplicationStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  pending: "secondary",
  reviewed: "default",
  shortlisted: "warning",
  interview: "warning",
  offered: "success",
  rejected: "destructive",
  withdrawn: "secondary",
};

interface AppWithJob extends Application {
  jobTitle?: string;
  companyName?: string;
}

export default function ApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<AppWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    async function load() {
      try {
        const apps = await getCandidateApplications(user!.uid);
        const enriched: AppWithJob[] = await Promise.all(
          apps.map(async (app) => {
            const job = await getJob(app.jobId).catch(() => null);
            return { ...app, jobTitle: job?.title, companyName: job?.companyName };
          })
        );
        setApplications(enriched);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Applications</h1>
        <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Applications</h1>

      {applications.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">No applications yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Start browsing jobs and apply to positions you like.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/job/${app.jobId}`)}>
              <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{app.jobTitle || "Unknown Job"}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" /> {app.companyName || "—"}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Applied {app.appliedAt ? timeAgo(app.appliedAt.toDate()) : "recently"}</span>
                  </div>
                  {app.coverLetter && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-1">{app.coverLetter}</p>
                  )}
                </div>
                <Badge variant={statusColors[app.status]} className="shrink-0">{app.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
