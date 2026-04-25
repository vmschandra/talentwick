"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/context/AuthContext";
import {
  Briefcase,
  Users,
  CreditCard,
  Search,
  ArrowRight,
  Building,
  TrendingUp,
  UserCircle,
  LayoutDashboard,
  Star,
} from "lucide-react";

const Beams = dynamic(
  () => import("@/components/ui/ethereal-beams-hero").then((m) => m.Beams),
  { ssr: false }
);

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
      {/* Hero with Ethereal Beams background */}
      <section className="relative overflow-hidden min-h-[90vh]" style={{ backgroundColor: "#0a0f2e" }}>
        {/* 3D Beams background */}
        <div className="absolute inset-0 z-0">
          <Beams
            beamWidth={2.5}
            beamHeight={18}
            beamNumber={15}
            lightColor="#ffffff"
            speed={2.5}
            noiseIntensity={2}
            scale={0.15}
            rotation={43}
          />
        </div>

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center rounded-full bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 text-sm text-white/90">
              <Star className="mr-2 h-4 w-4 text-white" />
              Trusted by 2,500+ companies worldwide
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Find Your Next{" "}
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Opportunity
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/70">
              {siteConfig.description}
            </p>
          </div>

          {isLoggedIn ? (
            <div className="mx-auto mt-12 max-w-md text-center">
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 text-white">
                <CardContent className="flex flex-col items-center gap-4 p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white">
                    <LayoutDashboard className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Welcome back{userDoc?.displayName ? `, ${userDoc.displayName.split(" ")[0]}` : ""}!
                    </h3>
                    <p className="mt-1 text-sm text-white/60">
                      Pick up where you left off
                    </p>
                  </div>
                  <Link href={dashboardPath} className="w-full">
                    <Button className="w-full gap-2 bg-white text-black hover:bg-gray-100 rounded-full">
                      Go to Dashboard <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/browse-jobs" className="w-full">
                    <Button variant="outline" className="w-full gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-full">
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
                <Card className="group h-full bg-white/5 backdrop-blur-xl border border-white/10 transition-all hover:bg-white/10 hover:border-white/20">
                  <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white">
                      <UserCircle className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">I&apos;m a Job Seeker</h3>
                      <p className="mt-1 text-sm text-white/60">
                        Search and apply for jobs from top companies
                      </p>
                    </div>
                    <Link href="/login?role=candidate" className="w-full">
                      <Button className="mt-2 w-full gap-2 bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-full">
                        Log in as Candidate <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <p className="text-xs text-white/40">
                      New here?{" "}
                      <Link href="/register?role=candidate" className="text-white/80 underline hover:text-white">
                        Create an account
                      </Link>
                    </p>
                  </CardContent>
                </Card>

                <Card className="group h-full bg-white/5 backdrop-blur-xl border border-white/10 transition-all hover:bg-white/10 hover:border-white/20">
                  <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black">
                      <Building className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">I&apos;m a Recruiter</h3>
                      <p className="mt-1 text-sm text-white/60">
                        Post jobs and find the perfect candidates
                      </p>
                    </div>
                    <Link href="/login?role=recruiter" className="w-full">
                      <Button className="mt-2 w-full gap-2 bg-white text-black hover:bg-gray-100 rounded-full">
                        Log in as Recruiter <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <p className="text-xs text-white/40">
                      New here?{" "}
                      <Link href="/register?role=recruiter" className="text-white/80 underline hover:text-white">
                        Create an account
                      </Link>
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 text-center">
                <Link href="/browse-jobs">
                  <Button variant="ghost" size="lg" className="gap-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full">
                    <Search className="h-4 w-4" /> Or browse jobs without signing in
                  </Button>
                </Link>
              </div>
            </>
          )}
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
    </div>
  );
}
