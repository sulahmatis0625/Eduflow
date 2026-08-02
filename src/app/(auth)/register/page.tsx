"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  BookOpen,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformStats } from "@/components/home/platform-stats";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-0 dot-grid">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex flex-1 bg-surface-1 items-center justify-center p-12 relative overflow-hidden">
        {/* Brand radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,204,0.05)_0%,_transparent_70%)]" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="max-w-md relative z-10">
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Join EduFlow</span>
          </h2>
          <p className="text-white/90 text-lg mb-10 leading-relaxed">
            Create your account and start learning from industry experts. Your
            journey to mastery begins here.
          </p>

          {/* Stats grid with glass cards */}
          <PlatformStats />

          {/* Decorative glow orbs */}
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-brand/[0.04] blur-3xl" />
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-purple-500/[0.04] blur-3xl" />
        </div>
      </div>

      {/* Right Panel - Form */}
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
          <h1 className="text-3xl font-bold text-white mb-2">
            Create your account
          </h1>
          <p className="text-white/85 mb-8">
            {step === 1
              ? "Choose how you want to use EduFlow"
              : "Fill in your details to get started"}
          </p>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                step >= 1 ? "bg-brand" : "bg-white/[0.08]"
              )}
            />
            <div
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                step >= 2 ? "bg-brand" : "bg-white/[0.08]"
              )}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              {/* Student card */}
              <button
                onClick={() => {
                  setRole("STUDENT");
                  setStep(2);
                }}
                className="w-full flex items-center gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur transition-all text-left hover:neon-border group"
              >
                <div className="bg-brand/10 border border-brand/20 p-3 rounded-xl">
                  <BookOpen className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <p className="font-semibold text-white mb-0.5">
                    I want to learn
                  </p>
                  <p className="text-sm text-white/40">
                    Browse courses, earn certificates, and track progress
                  </p>
                </div>
              </button>

              {/* Instructor card */}
              <button
                onClick={() => {
                  setRole("INSTRUCTOR");
                  setStep(2);
                }}
                className="w-full flex items-center gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur transition-all text-left hover:border-purple-400/40 group"
              >
                <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
                  <Briefcase className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-white mb-0.5">
                    I want to teach
                  </p>
                  <p className="text-sm text-white/75">
                    Create courses, reach students, and share knowledge
                  </p>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User className="h-4 w-4" />}
                required
              />

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
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-white/75 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock className="h-4 w-4" />}
                required
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={loading}
                >
                  Create Account
                </Button>
              </div>
            </form>
          )}

          {/* Sign in link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/40">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-brand hover:text-brand/80 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
