"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Clock,
  Settings,
  Users,
  BarChart3,
  Trash2,
} from "lucide-react";

type CourseCardData = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  status: string;
  totalLessons: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count: { enrollments: number };
};

export function InstructorCourseCard({ course }: { course: CourseCardData }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const statusVariant: Record<
    string,
    "default" | "success" | "warning" | "danger"
  > = {
    PUBLISHED: "success",
    DRAFT: "default",
    PENDING: "warning",
    ARCHIVED: "danger",
  };

  const canDelete =
    course.status === "DRAFT" || course.status === "PENDING";

  const handleDelete = async () => {
    if (!canDelete) return;
    if (
      !confirm(
        `Delete draft “${course.title}”? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not delete course");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card hover>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-shrink-0 w-full sm:w-40 h-28 rounded-lg overflow-hidden bg-white/[0.03]">
            {course.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-text-tertiary" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {course.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {course._count.enrollments} student
                    {course._count.enrollments !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {course.totalLessons} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Updated {formatDate(course.updatedAt)}
                  </span>
                </div>
              </div>
              <Badge variant={statusVariant[course.status] || "default"}>
                {course.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between mt-4 gap-2">
              <div className="flex items-center gap-3 text-sm text-text-tertiary">
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3.5 w-3.5" />
                  {course._count.enrollments} enrolled
                </span>
              </div>
              <div className="flex items-center gap-2">
                {canDelete && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    isLoading={deleting}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete
                  </Button>
                )}
                <Link href={`/dashboard/classrooms/${course.id}`}>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1.5" />
                    Manage
                  </Button>
                </Link>
              </div>
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-2">{error}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
