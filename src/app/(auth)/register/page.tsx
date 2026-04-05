"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User, Globe } from "lucide-react";

import {
  registerWithEmail,
  loginWithGoogle,
} from "@/lib/firebase/auth";
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

const registerSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("candidate");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema) as any,
    defaultValues: { displayName: "", email: "", password: "" },
  });

  function redirectToOnboarding(selectedRole: UserRole, uid: string) {
    document.cookie = `session=${uid}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    if (selectedRole === "recruiter") {
      router.push("/recruiter/company-profile");
    } else {
      router.push("/candidate/profile");
    }
  }

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      const user = await registerWithEmail(
        data.email,
        data.password,
        data.displayName,
        role
      );
      toast.success("Account created! Let's set up your profile.");
      redirectToOnboarding(role, user.uid);
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
      toast.success("Account created! Let's set up your profile.");
      redirectToOnboarding(role, user.uid);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Google sign-up failed";
      if (message.includes("popup-closed")) {
        return;
      }
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  }

  const isDisabled = isLoading || isGoogleLoading;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>
            Join TalentWick and take the next step in your career
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Role Toggle */}
          <div className="space-y-2">
            <Label>I want to...</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("candidate")}
                disabled={isDisabled}
                className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-4 text-sm font-medium transition-colors ${
                  role === "candidate"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-muted hover:border-muted-foreground/25"
                }`}
              >
                <User className="h-5 w-5" />
                Find a Job
              </button>
              <button
                type="button"
                onClick={() => setRole("recruiter")}
                disabled={isDisabled}
                className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-4 text-sm font-medium transition-colors ${
                  role === "recruiter"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-muted hover:border-muted-foreground/25"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" x2="19" y1="8" y2="14" />
                  <line x1="22" x2="16" y1="11" y2="11" />
                </svg>
                Hire Talent
              </button>
            </div>
          </div>

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
                Or register with email
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="displayName"
                  placeholder="John Doe"
                  className="pl-9"
                  disabled={isDisabled}
                  {...register("displayName")}
                />
              </div>
              {errors.displayName && (
                <p className="text-sm text-destructive">
                  {errors.displayName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  disabled={isDisabled}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  className="pl-9"
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

            <Button type="submit" className="w-full" disabled={isDisabled}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                `Create ${role === "recruiter" ? "Recruiter" : "Candidate"} Account`
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

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
