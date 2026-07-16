"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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

export default function LoginPage() {
  const router = useRouter();
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
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-0 dot-grid">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
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

          {/* Heading */}
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-text-secondary mb-8">
            Sign in to continue your learning journey
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
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
              Sign In
            </Button>
          </form>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/40">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-brand hover:text-brand/80 font-medium transition-colors"
              >
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Demo accounts */}
          <div className="mt-8 p-4 rounded-xl bg-surface-2 border border-white/[0.06]">
            <p className="text-sm text-text-secondary mb-3">
              Demo Accounts
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@eduflow.com");
                  setPassword("password123");
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/[0.03] transition-colors flex items-center gap-2"
              >
                <span className="text-xs font-medium text-purple-400 min-w-[72px]">
                  Admin
                </span>
                <span>admin@eduflow.com</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("instructor@eduflow.com");
                  setPassword("password123");
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/[0.03] transition-colors flex items-center gap-2"
              >
                <span className="text-xs font-medium text-brand min-w-[72px]">
                  Instructor
                </span>
                <span>instructor@eduflow.com</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("student@eduflow.com");
                  setPassword("password123");
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/[0.03] transition-colors flex items-center gap-2"
              >
                <span className="text-xs font-medium text-gold min-w-[72px]">
                  Student
                </span>
                <span>student@eduflow.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex flex-1 bg-surface-1 items-center justify-center p-12 relative overflow-hidden">
        {/* Brand radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,204,0.05)_0%,_transparent_70%)]" />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div className="max-w-md relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span className="text-xs font-medium text-brand">
              Platform
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

          {/* Decorative glow orb */}
          <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-brand/[0.04] blur-3xl" />
        </div>
      </div>
    </div>
  );
}
