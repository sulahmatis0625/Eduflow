"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Plus } from "lucide-react";

const levelOptions = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export default function NewClassroomPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    shortDescription: "",
    description: "",
    level: "BEGINNER",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          shortDescription: form.shortDescription,
          description: form.description,
          level: form.level,
          isFree: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create classroom.");
        setSubmitting(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Create a Classroom
        </h1>
        <p className="text-text-secondary mt-1">
          Give your classroom a name and short description. You can add sections
          and lessons later.
        </p>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Classroom name"
              name="title"
              placeholder="e.g. Algebra 101"
              value={form.title}
              onChange={handleChange}
              required
            />

            <Input
              label="Short description"
              name="shortDescription"
              placeholder="One-line summary for students"
              value={form.shortDescription}
              onChange={handleChange}
            />

            <Textarea
              label="Description"
              name="description"
              placeholder="What will students learn in this classroom?"
              value={form.description}
              onChange={handleChange}
              rows={5}
              required
            />

            <Select
              label="Level"
              name="level"
              options={levelOptions}
              value={form.level}
              onChange={handleChange}
            />

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/dashboard">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={submitting} disabled={submitting}>
                <Plus className="h-4 w-4 mr-2" />
                Create Classroom
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
