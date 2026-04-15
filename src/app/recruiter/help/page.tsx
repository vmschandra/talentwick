"use client";

import Link from "next/link";
import { HelpCircle, BookOpen, MessageCircle, FileText, Zap, Users, Briefcase, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const topics = [
  {
    icon: <Briefcase className="h-5 w-5 text-primary" />,
    title: "Posting a Job",
    description: "Learn how to create and publish a job posting to attract the right candidates.",
    href: "/recruiter/post-job",
  },
  {
    icon: <Users className="h-5 w-5 text-blue-600" />,
    title: "Managing Applicants",
    description: "Review applications, shortlist candidates, and update their status through the hiring pipeline.",
    href: "/recruiter/my-jobs",
  },
  {
    icon: <CreditCard className="h-5 w-5 text-amber-600" />,
    title: "Buying Credits",
    description: "Each credit lets you post one job for 30 days. Top up your balance anytime.",
    href: "/recruiter/pricing",
  },
  {
    icon: <Zap className="h-5 w-5 text-violet-600" />,
    title: "Browse Candidates",
    description: "Search and filter candidates by skill, job type, and experience to find the right hire.",
    href: "/recruiter/browse-candidates",
  },
];

const faqs = [
  {
    q: "How do job posting credits work?",
    a: "Each credit lets you post one active job for 30 days. Credits are deducted when you publish a job. You can buy more credits from the pricing page at any time.",
  },
  {
    q: "Can I edit a job after posting it?",
    a: "Yes. Go to My Jobs, open the job, and update any details. Changes take effect immediately.",
  },
  {
    q: "How do I move a candidate to the interview stage?",
    a: "Open the applicant list for any job, find the candidate, and change their status to 'Interview' using the status dropdown.",
  },
  {
    q: "What happens when a job expires?",
    a: "After 30 days the job is automatically marked expired and removed from the public listing. The credit is not refunded, but you can repost the job using a new credit.",
  },
  {
    q: "How are candidates matched to my jobs?",
    a: "The dashboard recommends candidates whose listed skills overlap with the skills you specified in your active job postings.",
  },
];

export default function HelpPage() {
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
            Guides and answers to get you up and running quickly.
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
