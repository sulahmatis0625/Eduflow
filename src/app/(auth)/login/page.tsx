"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  Users,
  Award,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTrial = searchParams.get("trial") === "1";
  const justRegistered = searchParams.get("registered") === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(
        result.error === "Configuration"
          ? "Authentication is unavailable right now. Please try again later."
          : "Invalid email or password"
      );
      setLoading(false);
      return;
    }

    // After credentials sign-in, claim free trial (if any) then land on My Courses
    const session = await getSession();
    if (session?.user?.role === "ADMIN") {
      router.push("/admin");
    } else if (isTrial) {
      // Brief pause so the session cookie is available to the enroll API
      await new Promise((r) => setTimeout(r, 150));
      try {
        await fetch("/api/enroll/free-trial", { method: "POST" });
      } catch {
        // Enrollment is best-effort; still send them to My Courses
      }
      router.push("/dashboard/courses");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen flex bg-surface-0 dot-grid">
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-3 mb-10">
            <div className="relative">
              <div className="bg-brand/10 border border-brand/20 p-2.5 rounded-xl">
                <GraduationCap className="h-6 w-6 text-brand" />
              </div>
            </div>
            <span className="text-2xl font-mono font-bold text-brand tracking-tight">
              EduFlow
            </span>
          </Link>

          <h1 className="text-3xl font-bold text-white mb-2">
            {isTrial ? "Sign in to start your free trial" : "Welcome back"}
          </h1>
          <p className="text-text-secondary mb-8">
            {isTrial
              ? "We’ll add the free starter course to My Courses after you sign in."
              : "Sign in to continue your learning journey"}
          </p>

          {justRegistered && (
            <div className="mb-4 p-3 rounded-lg bg-brand/10 border border-brand/20 text-brand text-sm">
              Account created
              {isTrial ? " and free course reserved" : ""}. Sign in to continue.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4" />}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-white/40 hover:text-white/60 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-white/[0.08] bg-surface-2 accent-brand h-4 w-4"
                />
                <span className="text-white/60">Remember me</span>
              </label>
              <Link
                href="#"
                className="text-sm text-brand/70 hover:text-brand transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={loading}
            >
              {isTrial ? "Sign in & open My Courses" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/40">
              Don&apos;t have an account?{" "}
              <Link
                href={isTrial ? "/register?trial=1" : "/register"}
                className="text-brand hover:text-brand/80 font-medium transition-colors"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-surface-1 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,204,0.05)_0%,_transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="max-w-md relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span className="text-xs font-medium text-brand">
              {isTrial ? "Free trial" : "Platform"}
            </span>
          </div>

          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Start learning</span>
            <br />
            <span className="text-white">today</span>
          </h2>

          <p className="text-text-secondary text-lg mb-10 leading-relaxed">
            Access thousands of courses, earn certificates, and track your
            progress. Join a community of passionate learners.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 group">
              <div className="bg-brand/10 border border-brand/20 p-2.5 rounded-xl">
                <Award className="h-5 w-5 text-brand" />
              </div>
              <span className="text-white/80">
                Expert-led courses with certificates
              </span>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="bg-brand/10 border border-brand/20 p-2.5 rounded-xl">
                <BookOpen className="h-5 w-5 text-brand" />
              </div>
              <span className="text-white/80">
                Live interactive classrooms
              </span>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="bg-brand/10 border border-brand/20 p-2.5 rounded-xl">
                <Users className="h-5 w-5 text-brand" />
              </div>
              <span className="text-white/80">
                Progress tracking & achievements
              </span>
            </div>
          </div>

          <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-brand/[0.04] blur-3xl" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface-0">
          <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
