import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase,
  Users,
  Target,
  Heart,
  ShieldCheck,
  Zap,
  Globe,
  TrendingUp,
  Building,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { siteConfig } from "@/config/site";

const values = [
  {
    icon: Heart,
    title: "People First",
    desc: "Every feature we build is designed around the real needs of job seekers and the companies that hire them.",
  },
  {
    icon: ShieldCheck,
    title: "Trust & Transparency",
    desc: "No hidden fees, no confusing subscriptions. Our pricing is clear and our policies are honest.",
  },
  {
    icon: Zap,
    title: "Speed & Simplicity",
    desc: "From posting a job to receiving an application — every workflow is optimised to take seconds, not minutes.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    desc: "We connect talent and opportunity across countries, industries, and experience levels — at any scale.",
  },
];

const stats = [
  { value: "50,000+", label: "Registered Candidates", icon: Users },
  { value: "2,500+", label: "Hiring Companies", icon: Building },
  { value: "10,000+", label: "Jobs Posted", icon: Briefcase },
  { value: "8,000+", label: "Successful Hires", icon: TrendingUp },
];

const forCandidates = [
  "Create a rich profile with skills, experience, and a downloadable resume",
  "Browse thousands of active job listings filtered by role, location, and salary",
  "Apply in one click — your profile travels with every application",
  "Track every application through a clear status timeline",
  "Receive direct messages from recruiters in real time",
  "Get notified instantly when your application status changes",
];

const forRecruiters = [
  "Post detailed job listings with rich requirements and salary ranges",
  "Browse a searchable pool of verified candidates",
  "Message candidates directly without leaving the platform",
  "Manage all applicants in a visual pipeline — from applied to offered",
  "Credit-based pricing: pay only for the postings you need",
  "Team collaboration tools to share notes and coordinate interviews",
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <Briefcase className="h-4 w-4 text-primary" />
            About TalentWick
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Connecting great people with <span className="text-primary">great companies</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            TalentWick is a modern job portal built for the way hiring actually works today —
            fast, direct, and built on real relationships between candidates and the companies
            that need them.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/browse-jobs">
              <Button size="lg" className="gap-2">
                Browse Jobs <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register?role=recruiter">
              <Button size="lg" variant="outline" className="gap-2">
                Start Hiring
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Target className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold">Our Mission</h2>
          <p className="max-w-2xl text-muted-foreground leading-relaxed">
            We built TalentWick because hiring was broken. Candidates were lost in applicant-tracking black
            holes. Recruiters were drowning in irrelevant CVs. TalentWick cuts through the noise with a
            platform that respects everyone&apos;s time — giving job seekers direct visibility into their
            applications and giving companies a clear, focused view of real talent.
          </p>
          <p className="max-w-2xl text-muted-foreground leading-relaxed">
            Our mission is simple: make every hire feel like a good match, for both sides of the table.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">What We Stand For</h2>
            <p className="mt-2 text-muted-foreground">The principles that guide every decision we make</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What you get — two columns */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Built for Both Sides of Hiring</h2>
          <p className="mt-2 text-muted-foreground">TalentWick gives every user exactly what they need</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">For Job Seekers</h3>
              </div>
              <ul className="space-y-3">
                {forCandidates.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=candidate" className="mt-6 block">
                <Button variant="outline" className="w-full gap-2">
                  Create a Free Account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">For Recruiters &amp; Companies</h3>
              </div>
              <ul className="space-y-3">
                {forRecruiters.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register?role=recruiter" className="mt-6 block">
                <Button className="w-full gap-2">
                  Start Posting Jobs <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact / CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/15">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold">Questions or Feedback?</h2>
          <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto">
            We&apos;re a small, focused team and we genuinely read every message.
            Reach us at{" "}
            <a
              href={`mailto:${siteConfig.adminEmail}`}
              className="underline underline-offset-2 hover:text-primary-foreground"
            >
              {siteConfig.adminEmail}
            </a>{" "}
            — we typically respond within one business day.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/browse-jobs">
              <Button size="lg" variant="secondary" className="gap-2">
                Browse Jobs <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                className="gap-2 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 border-0"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
