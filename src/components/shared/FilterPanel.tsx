"use client";

import { JobFilters, JobType, WorkMode, ExperienceLevel } from "@/types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterPanelProps {
  filters: JobFilters;
  onChange: (filters: JobFilters) => void;
}

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const update = (partial: Partial<JobFilters>) => onChange({ ...filters, ...partial });

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={() => onChange({})}>
          <X className="mr-1 h-3 w-3" /> Clear
        </Button>
      </div>

      <div>
        <Label>Job Type</Label>
        <Select value={filters.jobType?.[0] || ""} onValueChange={(v) => update({ jobType: v ? [v as JobType] : undefined })}>
          <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="full-time">Full-time</SelectItem>
            <SelectItem value="part-time">Part-time</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="internship">Internship</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Work Mode</Label>
        <Select value={filters.workMode?.[0] || ""} onValueChange={(v) => update({ workMode: v ? [v as WorkMode] : undefined })}>
          <SelectTrigger><SelectValue placeholder="All modes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="onsite">Onsite</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Experience Level</Label>
        <Select value={filters.experienceLevel || ""} onValueChange={(v) => update({ experienceLevel: (v || undefined) as ExperienceLevel | undefined })}>
          <SelectTrigger><SelectValue placeholder="All levels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="entry">Entry Level</SelectItem>
            <SelectItem value="mid">Mid Level</SelectItem>
            <SelectItem value="senior">Senior</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="executive">Executive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
