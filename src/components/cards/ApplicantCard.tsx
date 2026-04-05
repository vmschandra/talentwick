"use client";

import { Application, ApplicationStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Mail } from "lucide-react";

const statusColors: Record<ApplicationStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  pending: "secondary",
  reviewed: "default",
  shortlisted: "warning",
  interview: "warning",
  offered: "success",
  rejected: "destructive",
  withdrawn: "secondary",
};

interface ApplicantCardProps {
  application: Application;
  onStatusChange?: (id: string, status: ApplicationStatus) => void;
  showActions?: boolean;
}

export default function ApplicantCard({ application, onStatusChange, showActions = true }: ApplicantCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold">{application.candidateName}</h4>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" /> {application.candidateEmail}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={statusColors[application.status]}>{application.status}</Badge>
            {application.resumeURL && (
              <a href={application.resumeURL} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                  <FileText className="h-3.5 w-3.5" /> Resume
                </Button>
              </a>
            )}
          </div>
          {application.coverLetter && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{application.coverLetter}</p>
          )}
        </div>
        {showActions && onStatusChange && (
          <Select
            value={application.status}
            onValueChange={(v) => onStatusChange(application.id, v as ApplicationStatus)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offered">Offered</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  );
}
