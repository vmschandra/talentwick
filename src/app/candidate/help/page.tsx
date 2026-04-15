"use client";

import Link from "next/link";
import { HelpCircle, BookOpen, MessageCircle, FileText, Search, User, FileUp, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const topics = [
  {
    icon: <Search className="h-5 w-5 text-primary" />,
    title: "Finding Jobs",
    description: "Search and filter job listings by title, city, or country to find roles that match your skills.",
    href: "/candidate/jobs",
  },
  {
    icon: <User className="h-5 w-5 text-blue-600" />,
    title: "Building Your Profile",
    description: "A complete profile with headline, skills, and experience gets noticed by recruiters faster.",
    href: "/candidate/profile",
  },
  {
    icon: <FileUp className="h-5 w-5 text-amber-600" />,
    title: "Uploading Your Resume",
    description: "Upload a PDF resume on your profile page so recruiters can view it with one click.",
    href: "/candidate/profile",
  },
  {
    icon: <Bell className="h-5 w-5 text-violet-600" />,
    title: "Application Updates",
    description: "Check your notifications for status updates whenever a recruiter reviews your application.",
    href: "/candidate/applications",
  },
];

const faqs = [
  {
    q: "How do I apply for a job?",
    a: "Open any job from the Find Jobs page and click Apply. Make sure your profile is complete before applying — recruiters will see it.",
  },
  {
    q: "Can I edit my profile after submitting an application?",
    a: "Yes, you can update your profile at any time. Recruiters who have already viewed your profile will see the latest version.",
  },
  {
    q: "How do I know if a recruiter viewed my application?",
    a: "You will receive a notification when a recruiter changes your application status (e.g. Shortlisted, Interview, Rejected).",
  },
  {
    q: "What does 'Open to Work' mean?",
    a: "Enabling 'Open to Work' on your profile makes you visible in the recruiter's candidate browser, increasing your chances of being discovered.",
  },
  {
    q: "How is my profile completeness calculated?",
    a: "Completeness is based on five sections: headline, summary, skills, work experience, education, and resume. Filling all sections reaches 100%.",
  },
];

export default function CandidateHelpPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <HelpCircle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Guides and answers to help you land your next opportunity.
          </p>
        </div>
      </div>

      {/* Quick links */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Quick guides
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {topics.map((t) => (
            <Link key={t.title} href={t.href}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex gap-3 p-4">
                  <div className="mt-0.5 shrink-0">{t.icon}</div>
                  <div>
                    <p className="font-medium text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" /> Frequently asked questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.q}>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">{faq.q}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Still need help?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Contact us at{" "}
              <a href="mailto:support@talentwick.com" className="text-primary hover:underline">
                support@talentwick.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
