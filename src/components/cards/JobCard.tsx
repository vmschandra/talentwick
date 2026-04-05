"use client";

import Link from "next/link";
import { Job } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Briefcase, DollarSign, Building } from "lucide-react";
import { timeAgo, formatCurrency } from "@/lib/utils";

interface JobCardProps {
  job: Job;
  linkPrefix?: string;
}

export default function JobCard({ job, linkPrefix = "/job" }: JobCardProps) {
  return (
    <Link href={`${linkPrefix}/${job.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{job.title}</h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{job.companyName}</span>
              </div>
            </div>
            {job.isFeatured && <Badge variant="warning">Featured</Badge>}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.location}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" /> {job.jobType}
            </span>
            <Badge variant="outline" className="text-xs">{job.workMode}</Badge>
            <Badge variant="outline" className="text-xs">{job.experienceLevel}</Badge>
          </div>

          {job.salary && (
            <p className="mt-2 flex items-center gap-1 text-sm font-medium text-green-700">
              <DollarSign className="h-3.5 w-3.5" />
              {formatCurrency(job.salary.min, job.salary.currency)} - {formatCurrency(job.salary.max, job.salary.currency)} / {job.salary.period}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.skills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
            ))}
            {job.skills.length > 4 && (
              <Badge variant="secondary" className="text-xs">+{job.skills.length - 4}</Badge>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {job.createdAt ? timeAgo(job.createdAt.toDate()) : "Recently"}
            </span>
            <span>{job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
