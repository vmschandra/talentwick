"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Globe, UserCircle, Building, ArrowRight } from "lucide-react";
import { WORLD_LOCATIONS } from "@/lib/data/locations";
import SearchableSelect from "@/components/shared/SearchableSelect";

const COUNTRIES = Object.keys(WORLD_LOCATIONS).sort();

import {
  registerWithEmail,
  loginWithGoogle,
  getUserDoc,
} from "@/lib/firebase/auth";
import { triggerEmail } from "@/lib/email/send-client";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const baseSchema = {
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Please enter a valid email address"),
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .regex(/^[+\d][\d\s\-()]*$/, "Enter a valid phone number"),
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
};

const candidateSchema = z.object(baseSchema);

const recruiterSchema = z.object({
  ...baseSchema,
  companyName: z.string().min(2, "Company name is required"),
  designation: z.string().min(2, "Designation is required"),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;
type RecruiterFormValues = z.infer<typeof recruiterSchema>;

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") as UserRole | null;

  if (role !== "candidate" && role !== "recruiter") {
    return <RolePicker />;
  }

  return <RegisterForm role={role} />;
}

function RolePicker() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Create your TalentWick account</h1>
          <p className="mt-2 text-muted-foreground">What kind of account would you like?</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/register?role=candidate" className="group">
            <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <UserCircle className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Job Seeker</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Find and apply for jobs
                  </p>
                </div>
                <Button className="w-full bg-primary/10 text-primary hover:bg-primary/20">
                  Sign up as Candidate <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/register?role=recruiter" className="group">
            <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Building className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Recruiter</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Post jobs and hire talent
                  </p>
                </div>
                <Button className="w-full">
                  Sign up as Recruiter <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function RegisterForm({ role }: { role: "candidate" | "recruiter" }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const isRecruiter = role === "recruiter";
  const schema = isRecruiter ? recruiterSchema : candidateSchema;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RecruiterFormValues>({
    // @ts-expect-error -- conditional schema (candidateSchema | recruiterSchema) causes resolver
    // input type to diverge from the RecruiterFormValues form type. Runtime behavior is correct.
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "",
      city: "",
      password: "",
      ...(isRecruiter ? { companyName: "", designation: "" } : {}),
    },
  });

  function redirectToOnboarding() {
    // Full page reload so AuthContext re-fetches the freshly-written user doc
    window.location.href = isRecruiter ? "/recruiter/company-profile" : "/candidate/profile";
  }

  async function onSubmit(data: CandidateFormValues | RecruiterFormValues) {
    setIsLoading(true);
    try {
      const user = await registerWithEmail(data.email, data.password, role, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        country: data.country,
        city: data.city,
        companyName: "companyName" in data ? data.companyName : undefined,
        designation: "designation" in data ? data.designation : undefined,
      });
      toast.success("Account created! Let's set up your profile.");
      // Fire-and-forget welcome email
      user.getIdToken().then((token) =>
        triggerEmail(token, { type: "welcome", uid: user.uid })
      );
      redirectToOnboarding();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      if (message.includes("email-already-in-use")) {
        toast.error("An account with this email already exists. Try signing in.");
      } else if (message.includes("weak-password")) {
        toast.error("Password is too weak. Use at least 6 characters.");
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setIsGoogleLoading(true);
    try {
      const user = await loginWithGoogle(role);
      const existingDoc = await getUserDoc(user.uid);

      if (existingDoc && existingDoc.role !== role) {
        const existingRole = existingDoc.role === "recruiter" ? "Recruiter" : "Candidate";
        toast.error(
          `This Google account is already registered as a ${existingRole}. Please use a different account.`
        );
        return;
      }

      if (existingDoc) {
        toast.success("Welcome back! Redirecting to your dashboard.");
        if (isRecruiter) {
          window.location.href = existingDoc.onboardingComplete ? "/recruiter/dashboard" : "/recruiter/company-profile";
        } else {
          window.location.href = existingDoc.onboardingComplete ? "/candidate/dashboard" : "/candidate/profile";
        }
      } else {
        toast.success("Account created! Let's set up your profile.");
        redirectToOnboarding();
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Google sign-up failed";
      if (!message.includes("popup-closed") && !message.includes("cancelled-popup")) {
        toast.error(message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  const isDisabled = isLoading || isGoogleLoading;
  const recruiterErrors = errors as Partial<Record<keyof RecruiterFormValues, { message?: string }>>;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isRecruiter ? <Building className="h-6 w-6" /> : <UserCircle className="h-6 w-6" />}
          </div>
          <CardTitle className="text-2xl">
            {isRecruiter ? "Create a Recruiter Account" : "Create a Candidate Account"}
          </CardTitle>
          <CardDescription>
            {isRecruiter
              ? "Tell us about you and the company you're hiring for"
              : "Tell us a bit about yourself to get started"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Signup */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogleSignup}
            disabled={isDisabled}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or fill in your details
              </span>
            </div>
          </div>

          {/* Registration Form */}
          {/* @ts-expect-error -- union form type; see resolver comment above */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  disabled={isDisabled}
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  disabled={isDisabled}
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isDisabled}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 555 123 4567"
                disabled={isDisabled}
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Country *</Label>
                <SearchableSelect
                  value={selectedCountry}
                  onChange={(v) => {
                    setSelectedCountry(v);
                    setSelectedCity("");
                    setValue("country", v, { shouldValidate: true });
                    setValue("city", "", { shouldValidate: false });
                  }}
                  options={COUNTRIES}
                  placeholder="Search country..."
                  disabled={isDisabled}
                />
                <input type="hidden" {...register("country")} />
                {errors.country && (
                  <p className="text-sm text-destructive">{errors.country.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <SearchableSelect
                  value={selectedCity}
                  onChange={(v) => {
                    setSelectedCity(v);
                    setValue("city", v, { shouldValidate: true });
                  }}
                  options={selectedCountry ? (WORLD_LOCATIONS[selectedCountry] ?? []) : []}
                  placeholder={selectedCountry ? "Search city..." : "Select country first"}
                  disabled={isDisabled || !selectedCountry}
                />
                <input type="hidden" {...register("city")} />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>
            </div>

            {isRecruiter && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company You&apos;re Hiring For *</Label>
                  <Input
                    id="companyName"
                    placeholder="Acme Inc."
                    disabled={isDisabled}
                    {...register("companyName" as const)}
                  />
                  {recruiterErrors.companyName && (
                    <p className="text-sm text-destructive">{recruiterErrors.companyName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Your Current Designation *</Label>
                  <Input
                    id="designation"
                    placeholder="Talent Acquisition Manager"
                    disabled={isDisabled}
                    {...register("designation" as const)}
                  />
                  {recruiterErrors.designation && (
                    <p className="text-sm text-destructive">{recruiterErrors.designation.message}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
                disabled={isDisabled}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isDisabled}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                `Create ${isRecruiter ? "Recruiter" : "Candidate"} Account`
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={`/login?role=${role}`}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
          <Link href="/register" className="text-xs text-muted-foreground hover:text-foreground">
            &larr; Choose a different account type
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
