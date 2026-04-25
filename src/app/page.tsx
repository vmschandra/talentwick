"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/context/AuthContext";
import { Users, CreditCard, Search, ArrowRight, Building, UserCircle, LayoutDashboard } from "lucide-react";

const features = [
  {
    icon: <Search className="h-6 w-6" />,
    title: "Smart Job Search",
    desc: "Advanced filters by role, location, salary, and work mode to find your perfect match.",
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "Pay-Per-Post Credits",
    desc: "Flexible credit-based pricing. Buy only what you need, no subscriptions required.",
  },
  {
    icon: <Users className="h-6 w-6" />,
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
  const [mobileTab, setMobileTab] = useState<"candidate" | "recruiter">("candidate");

  const dashboardPath =
    userDoc?.role === "recruiter"
      ? "/recruiter/dashboard"
      : userDoc?.role === "admin"
      ? "/admin/dashboard"
      : "/candidate/dashboard";

  const CandidateContent = (
    <div className="flex flex-col items-center text-center">
      <div className="mb-8 max-w-md">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Find Your Next <span className="text-primary">Opportunity</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Be Seen. Be Hired. Be Valued.
        </p>
      </div>
      <Card className="w-full max-w-sm transition-all hover:shadow-lg hover:border-primary/50">
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
      <div className="mt-12 w-full max-w-sm text-left">
        <div className="flex flex-col gap-5">
          {steps.map((step) => (
            <div key={step.num} className="flex items-start gap-4">
              <span className="text-2xl font-bold text-primary/30 w-8 shrink-0">{step.num}</span>
              <div>
                <p className="font-semibold text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8">
        <Link href="/browse-jobs">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Search className="h-4 w-4" /> Browse jobs without signing in
          </Button>
        </Link>
      </div>
    </div>
  );

  const RecruiterContent = (
    <div className="flex flex-col items-center text-center">
      <div className="mb-8 max-w-md">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Your next great hire is <span className="text-primary">already out there.</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your next great hire is already out there.
        </p>
      </div>
      <Card className="w-full max-w-sm transition-all hover:shadow-lg hover:border-primary/50">
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
      <div className="mt-12 w-full max-w-sm text-left">
        <div className="flex flex-col gap-5">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {f.icon}
              </div>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {isLoggedIn ? (
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-md text-center">
              <Card>
                <CardContent className="flex flex-col items-center gap-4 p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <LayoutDashboard className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      Welcome back{userDoc?.displayName ? `, ${userDoc.displayName.split(" ")[0]}` : ""}!
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">Pick up where you left off</p>
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
          </div>
        ) : (
          <>
            {/* ── Mobile layout (below lg) ── */}
            <div className="lg:hidden">
              {/* Sticky tab switcher */}
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
                <div className="flex rounded-xl bg-muted p-1 gap-1">
                  <button
                    onClick={() => setMobileTab("candidate")}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                      mobileTab === "candidate"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Job Seeker
                  </button>
                  <button
                    onClick={() => setMobileTab("recruiter")}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                      mobileTab === "recruiter"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Recruiter
                  </button>
                </div>
              </div>

              {/* Animated content */}
              <div className="px-6 py-10 overflow-hidden">
                <AnimatePresence mode="wait">
                  {mobileTab === "candidate" ? (
                    <motion.div
                      key="candidate"
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    >
                      {CandidateContent}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="recruiter"
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    >
                      {RecruiterContent}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Desktop layout (lg and above) ── */}
            <div className="hidden lg:grid lg:grid-cols-2 overflow-hidden">
              {/* Left: Candidates — slides in from left */}
              <motion.div
                initial={{ opacity: 0, x: -60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="flex flex-col items-center px-8 py-16 lg:px-16 text-center border-r border-border"
              >
                {CandidateContent}
              </motion.div>
              {/* Right: Recruiters — slides in from right */}
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="flex flex-col items-center px-8 py-16 lg:px-16 text-center bg-primary/5"
              >
                {RecruiterContent}
              </motion.div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
