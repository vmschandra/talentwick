"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock, Globe, UserCircle, Building, ShieldCheck } from "lucide-react";

import { loginWithEmail, loginWithGoogle, logout, getUserDoc } from "@/lib/firebase/auth";
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

const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

const roleConfig = {
  candidate: {
    icon: <UserCircle className="h-6 w-6 text-primary" />,
    title: "Candidate Login",
    description: "Sign in to find and apply for jobs",
  },
  recruiter: {
    icon: <Building className="h-6 w-6 text-primary" />,
    title: "Recruiter Login",
    description: "Sign in to post jobs and manage applicants",
  },
  admin: {
    icon: <ShieldCheck className="h-6 w-6 text-primary" />,
    title: "Admin Login",
    description: "Sign in to the admin dashboard",
  },
};

function RolePicker() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Welcome to TalentWick</h1>
          <p className="mt-2 text-muted-foreground">How would you like to sign in?</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/login?role=candidate" className="group">
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
                  Continue as Candidate
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/login?role=recruiter" className="group">
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
                  Continue as Recruiter
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register?role=candidate" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") as keyof typeof roleConfig | null;
  const config = role && roleConfig[role] ? roleConfig[role] : null;
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Clear the form whenever the user switches between Candidate / Recruiter tabs
  useEffect(() => {
    reset({ email: "", password: "" });
    setLoginError(null);
  }, [role, reset]);

  // No role selected — show the role picker
  if (!role || !roleConfig[role]) {
    return <RolePicker />;
  }

  function getFriendlyError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("user-not-found")) return "Account doesn't exist. Please register.";
    if (message.includes("wrong-password") || message.includes("invalid-credential")) return "Invalid email or password. Please try again.";
    if (message.includes("too-many-requests")) return "Too many attempts. Please try again later.";
    if (message.includes("operation-not-allowed")) return "This sign-in method is not enabled. Please try another method.";
    if (message.includes("network-request-failed")) return "Network error. Please check your connection and try again.";
    if (message.includes("user-disabled")) return "This account has been disabled. Please contact support.";
    if (message.includes("invalid-email")) return "Please enter a valid email address.";
    if (message.includes("popup-closed") || message.includes("cancelled-popup-request")) return "Google sign-in was cancelled. Please try again.";
    if (message.includes("unauthorized-domain")) return "This domain is not authorized. Please contact support.";
    return "Something went wrong. Please try again.";
  }

  // Validates the user's role doc and either aborts (with logout) or commits
  // the session cookie and redirects. The cookie is intentionally set AFTER
  // validation so it is never persisted when login is rejected.
  async function validateAndRedirect(uid: string, userDocData: { role: string; onboardingComplete?: boolean } | null) {
    if (!userDocData) {
      await logout();
      setLoginError("No account found. Please register first.");
      return;
    }

    if (role !== "admin" && userDocData.role !== role) {
      const existingRole = userDocData.role === "recruiter" ? "Recruiter" : "Candidate";
      const attemptedRole = role === "recruiter" ? "Recruiter" : "Candidate";
      await logout();
      setLoginError(
        `This account is registered as a ${existingRole}. Please log in from the ${existingRole} login page, or use a different account to sign in as a ${attemptedRole}.`
      );
      return;
    }

    // Validation passed — commit the session cookie then hard-navigate so all
    // server components and middleware see the fresh auth state.
    document.cookie = `session=${uid}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

    // Onboarding takes priority — incomplete users must finish setup first.
    if (!userDocData.onboardingComplete) {
      window.location.href = userDocData.role === "recruiter"
        ? "/recruiter/company-profile"
        : "/candidate/profile";
      return;
    }

    // Default landing page per role.
    const defaultPath =
      userDocData.role === "admin"
        ? "/admin/dashboard"
        : userDocData.role === "recruiter"
        ? "/recruiter/dashboard"
        : "/candidate/dashboard";

    // Honor the ?redirect= param only for safe internal paths.
    const redirectParam = searchParams.get("redirect");
    const safePath =
      redirectParam &&
      redirectParam.startsWith("/") &&
      !redirectParam.startsWith("//")
        ? redirectParam
        : defaultPath;

    window.location.href = safePath;
  }

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setLoginError(null);
    try {
      const user = await loginWithEmail(data.email, data.password);
      const userDocData = await getUserDoc(user.uid);
      await validateAndRedirect(user.uid, userDocData);
    } catch (error: unknown) {
      setLoginError(getFriendlyError(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setLoginError(null);
    try {
      const user = await loginWithGoogle();
      const userDocData = await getUserDoc(user.uid);
      await validateAndRedirect(user.uid, userDocData);
    } catch (error: unknown) {
      setLoginError(getFriendlyError(error));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  const isDisabled = isLoading || isGoogleLoading;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {config && (
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {config.icon}
            </div>
          )}
          <CardTitle className="text-2xl">{config ? config.title : "Welcome Back"}</CardTitle>
          <CardDescription>{config ? config.description : "Sign in to your TalentWick account"}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Login */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogleLogin}
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
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  autoComplete="username"
                  disabled={isDisabled}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-9"
                  autoComplete="current-password"
                  disabled={isDisabled}
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {loginError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {loginError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isDisabled}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-3">
          {role !== "admin" && (
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href={`/register?role=${role}`} className="font-medium text-primary hover:underline">
                Create one
              </Link>
            </p>
          )}
          {role && (
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
              &larr; Back to home
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
