"use client";

import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CandidateMessagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Communicate directly with recruiters.
          </p>
        </div>
        <Badge variant="secondary">Coming Soon</Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Welcome to Messages</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              When a recruiter reaches out to you, conversations will appear here.
              This feature is coming soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
