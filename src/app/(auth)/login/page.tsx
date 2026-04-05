"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Globe } from "lucide-react";

import { loginWithEmail, loginWithGoogle, getUserDoc } from "@/lib/firebase/auth";
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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: { email: "", password: "" },
  });

  async function redirectByRole(uid: string) {
    const userDoc = await getUserDoc(uid);
    if (!userDoc) {
      router.push("/register");
      return;
    }
    document.cookie = `session=${uid}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

    switch (userDoc.role) {
      case "admin":
        router.push("/admin/dashboard");
        break;
      case "recruiter":
        router.push(userDoc.onboardingComplete ? "/recruiter/dashboard" : "/recruiter/company-profile");
        break;
      case "candidate":
      default:
        router.push(userDoc.onboardingComplete ? "/candidate/dashboard" : "/candidate/profile");
        break;
    }
  }

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const user = await loginWithEmail(data.email, data.password);
      toast.success("Welcome back!");
      await redirectByRole(user.uid);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to sign in";
      if (message.includes("user-not-found") || message.includes("wrong-password") || message.includes("invalid-credential")) {
        toast.error("Invalid email or password. Please try again.");
      } else if (message.includes("too-many-requests")) {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      toast.success("Welcome back!");
      await redirectByRole(user.uid);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Google sign-in failed";
      if (message.includes("popup-closed")) {
        return; // user closed the popup, no error needed
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
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your HireFlow account</CardDescription>
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
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
