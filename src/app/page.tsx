"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { Briefcase, Users, CreditCard, Search, ArrowRight, CheckCircle2, Building, TrendingUp } from "lucide-react";

const stats = [
  { label: "Jobs Posted", value: "10,000+", icon: <Briefcase className="h-5 w-5" /> },
  { label: "Companies", value: "2,500+", icon: <Building className="h-5 w-5" /> },
  { label: "Candidates", value: "50,000+", icon: <Users className="h-5 w-5" /> },
  { label: "Hires Made", value: "8,000+", icon: <TrendingUp className="h-5 w-5" /> },
];

const features = [
  {
    icon: <Search className="h-8 w-8" />,
    title: "Smart Job Search",
    desc: "Advanced filters by role, location, salary, and work mode to find your perfect match.",
  },
  {
    icon: <CreditCard className="h-8 w-8" />,
    title: "Pay-Per-Post Credits",
    desc: "Flexible credit-based pricing. Buy only what you need, no subscriptions required.",
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Applicant Tracking",
    desc: "Manage candidates through a visual pipeline from application to offer.",
  },
];

const steps = [
  { num: "01", title: "Create an Account", desc: "Sign up as a job seeker or recruiter in seconds." },
  { num: "02", title: "Complete Your Profile", desc: "Add skills, experience, and resume to stand out." },
  { num: "03", title: "Apply or Post Jobs", desc: "Seekers apply for free. Recruiters post with credits." },
  { num: "04", title: "Get Hired", desc: "Connect with great companies and land your dream job." },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Find Your Next <span className="text-primary">Opportunity</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              {siteConfig.description}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/browse-jobs">
                <Button size="lg" className="gap-2">
                  <Search className="h-4 w-4" /> Browse Jobs
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="gap-2">
                  Post a Job <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {s.icon}
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Everything You Need</h2>
          <p className="mt-2 text-muted-foreground">Powerful tools for both job seekers and recruiters</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold">How It Works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <span className="text-4xl font-bold text-primary/20">{step.num}</span>
                <h3 className="mt-2 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-primary p-10 text-center text-primary-foreground md:p-16">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mt-4 text-primary-foreground/80">
            Join thousands of professionals and companies already using {siteConfig.name}.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                <CheckCircle2 className="h-4 w-4" /> Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
