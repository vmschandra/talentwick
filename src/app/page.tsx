"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/context/AuthContext";
import { Users, CreditCard, Search, ArrowRight, Building, UserCircle, LayoutDashboard } from "lucide-react";

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
  { num: "01", title: "Create an Account", desc: "Sign up as a job seeker in seconds." },
  { num: "02", title: "Complete Your Profile", desc: "Add skills, experience, and resume to stand out." },
  { num: "03", title: "Apply or Post Jobs", desc: "Job seekers apply for free." },
  { num: "04", title: "Get Hired", desc: "Connect with great companies and land your dream job." },
];

export default function HomePage() {
  const { user, userDoc, loading } = useAuth();
  const isLoggedIn = !loading && !!user;

  const dashboardPath =
    userDoc?.role === "recruiter"
      ? "/recruiter/dashboard"
      : userDoc?.role === "admin"
      ? "/admin/dashboard"
      : "/candidate/dashboard";

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
          </div>

          {isLoggedIn ? (
            <div className="mx-auto mt-12 max-w-md text-center">
              <Card>
                <CardContent className="flex flex-col items-center gap-4 p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <LayoutDashboard className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      Welcome back{userDoc?.displayName ? `, ${userDoc.displayName.split(" ")[0]}` : ""}!
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pick up where you left off
                    </p>
                  </div>
                  <Link href={dashboardPath} className="w-full">
                    <Button className="w-full gap-2">
                      Go to Dashboard <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/browse-jobs" className="w-full">
                    <Button variant="outline" className="w-full gap-2">
                      <Search className="h-4 w-4" /> Browse Jobs
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              {/* Role-based login cards */}
              <div className="mx-auto mt-12 grid max-w-2xl gap-6 sm:grid-cols-2">
                <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/50">
                  <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserCircle className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">I&apos;m a Job Seeker</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Search and apply for jobs from top companies
                      </p>
                    </div>
                    <Link href="/login?role=candidate" className="w-full">
                      <Button className="mt-2 w-full gap-2 bg-primary/10 text-primary hover:bg-primary/20">
                        Log in as Candidate <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      New here?{" "}
                      <Link href="/register?role=candidate" className="text-primary underline">
                        Create an account
                      </Link>
                    </p>
                  </CardContent>
                </Card>

                <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/50">
                  <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Building className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">I&apos;m a Recruiter</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Post jobs and find the perfect candidates
                      </p>
                    </div>
                    <Link href="/login?role=recruiter" className="w-full">
                      <Button className="mt-2 w-full gap-2">
                        Log in as Recruiter <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      New here?{" "}
                      <Link href="/register?role=recruiter" className="text-primary underline">
                        Create an account
                      </Link>
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 text-center">
                <Link href="/browse-jobs">
                  <Button variant="ghost" size="lg" className="gap-2 text-muted-foreground">
                    <Search className="h-4 w-4" /> Or browse jobs without signing in
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>


      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">For Recruiters</h2>
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
          <h2 className="text-center text-3xl font-bold">For Candidates</h2>
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

    </div>
  );
}
