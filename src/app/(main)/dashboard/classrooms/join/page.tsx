"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";

export default function JoinClassroomPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!code.trim()) {
      setError("Please enter a classroom code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/classrooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join classroom.");
        return;
      }

      setSuccess(`Successfully joined "${data.courseTitle}"! Redirecting...`);
      setTimeout(() => {
        router.push("/dashboard/courses");
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-brand/10 border border-brand/20 mb-4">
            <Users className="h-8 w-8 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Join a Classroom
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            Enter the code shared by your teacher to join a classroom
          </p>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <Input
                label="Classroom Code"
                placeholder="Enter classroom code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                disabled={loading}
              />

              {error && (
                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {success && (
                <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm text-emerald-400">{success}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !code.trim()}
              >
                {loading ? "Joining..." : "Join Classroom"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
