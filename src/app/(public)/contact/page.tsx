import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, Clock, HelpCircle, Briefcase, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Contact Us" };

const SUPPORT_EMAIL = "support@talentwick.com";

const topics = [
  {
    icon: HelpCircle,
    title: "General Support",
    desc: "Questions about your account, profile, or how the platform works.",
  },
  {
    icon: Briefcase,
    title: "Job Postings",
    desc: "Help with creating, editing, or managing your job listings.",
  },
  {
    icon: CreditCard,
    title: "Billing & Credits",
    desc: "Questions about purchases, invoices, or refund requests.",
  },
  {
    icon: MessageSquare,
    title: "Feedback",
    desc: "Feature requests, bug reports, or general feedback about TalentWick.",
  },
];

export default function ContactPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            We&apos;re a small team and we read every message. Reach out and we&apos;ll
            get back to you within one business day.
          </p>
          <Button asChild size="lg" className="mt-8">
            <a href={`mailto:${SUPPORT_EMAIL}`}>
              <Mail className="mr-2 h-4 w-4" /> Email Us at {SUPPORT_EMAIL}
            </a>
          </Button>
        </div>
      </section>

      {/* Topics */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold mb-2">What can we help with?</h2>
        <p className="text-center text-muted-foreground text-sm mb-10">
          Include a brief description of your issue in your email so we can help you faster.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {topics.map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Response time + email CTA */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <p className="text-sm">Typical response time: <strong className="text-foreground">within 1 business day</strong></p>
          </div>

          <div className="rounded-xl border bg-background p-6 space-y-3">
            <p className="text-sm font-medium">Send us an email directly</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-xl font-semibold text-primary hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            <p className="text-xs text-muted-foreground">
              Please include your registered email address and a description of your issue.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm pt-2">
            <Link href="/about" className="text-muted-foreground hover:text-foreground">About TalentWick</Link>
            <Link href="/refund" className="text-muted-foreground hover:text-foreground">Refund Policy</Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
