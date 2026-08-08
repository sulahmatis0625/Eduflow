"use client";

import Link from "next/link";
import { PlayCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * Landing CTA: Start Free Trial
 * Guests → sign up (?trial=1) → after account + sign-in → My Courses with free HTML course
 * Logged-in students → claim free course → My Courses
 */
export function TrialVideoModal() {
  const [claiming, setClaiming] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoggedInStudent =
    status === "authenticated" &&
    session?.user &&
    session.user.role !== "INSTRUCTOR" &&
    session.user.role !== "ADMIN";

  const claimAndGo = async () => {
    setClaiming(true);
    try {
      await fetch("/api/enroll/free-trial", { method: "POST" });
      router.push("/dashboard/courses");
      router.refresh();
    } catch {
      router.push("/dashboard/courses");
    } finally {
      setClaiming(false);
    }
  };

  if (status === "loading") {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-white/10 text-white/60 text-sm rounded-full"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Start Free Trial
      </button>
    );
  }

  if (isLoggedInStudent) {
    return (
      <button
        type="button"
        onClick={claimAndGo}
        disabled={claiming}
        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-white/10 text-white text-sm rounded-full hover:border-white/20 transition-all duration-300 disabled:opacity-60"
      >
        {claiming ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PlayCircle className="h-4 w-4" />
        )}
        Start Free Trial
      </button>
    );
  }

  return (
    <Link
      href="/register?trial=1"
      className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-white/10 text-white text-sm rounded-full hover:border-white/20 transition-all duration-300"
    >
      <PlayCircle className="h-4 w-4" />
      Start Free Trial
    </Link>
  );
}
