"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen, CheckCircle, Archive, Eye, Search, XCircle, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Course {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number;
  isFree: boolean;
  isFeatured: boolean;
  createdAt: string;
  instructor: { id: string; name: string | null; email: string };
  _count: { enrollments: number };
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending Review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const statusBadgeVariant = (status: string) => {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "default" | "purple"> = {
    PUBLISHED: "success",
    PENDING: "warning",
    DRAFT: "default",
    ARCHIVED: "danger",
  };
  return map[status] || "default";
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/courses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch {
      // Failed to fetch courses
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const updateCourseStatus = async (courseId: string, newStatus: string) => {
    setActionLoading(courseId);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, status: newStatus } : c))
        );
      }
    } catch {
      // Failed to update course
    } finally {
      setActionLoading(null);
    }
  };

  const toggleFeatured = async (courseId: string, isFeatured: boolean) => {
    setActionLoading(courseId);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !isFeatured }),
      });
      if (res.ok) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === courseId ? { ...c, isFeatured: !isFeatured } : c
          )
        );
      }
    } catch {
      // Failed to toggle featured
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Course Management
        </h1>
        <p className="text-text-tertiary mt-1">
          Review, approve, and manage all courses on the platform
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">
              All Courses ({courses.length})
            </h2>
          </div>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            </div>
          ) : courses.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-12 w-12" />}
              title="No courses found"
              description="No courses match your current filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Course
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Instructor
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Price
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Enrollments
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {course.title}
                          </p>
                          <p className="text-xs text-text-tertiary mt-0.5">
                            /{course.slug}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {course.instructor.name || course.instructor.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusBadgeVariant(course.status)}>
                          {course.status}
                        </Badge>
                        {course.isFeatured && (
                          <Badge variant="purple" className="ml-1">
                            Featured
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-primary">
                          {course.isFree ? "Free" : `$${course.price.toFixed(2)}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {course._count.enrollments}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {course.status === "PENDING" && (
                            <>
                              <Link
                                href={`/courses/${course.slug}`}
                                target="_blank"
                              >
                                <Button size="sm" variant="outline" title="Preview course">
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                  Preview
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() =>
                                  updateCourseStatus(course.id, "PUBLISHED")
                                }
                                isLoading={actionLoading === course.id}
                                disabled={actionLoading === course.id}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() =>
                                  updateCourseStatus(course.id, "DRAFT")
                                }
                                isLoading={actionLoading === course.id}
                                disabled={actionLoading === course.id}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {course.status === "DRAFT" && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                updateCourseStatus(course.id, "PUBLISHED")
                              }
                              isLoading={actionLoading === course.id}
                              disabled={actionLoading === course.id}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Publish
                            </Button>
                          )}
                          {course.status === "PUBLISHED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateCourseStatus(course.id, "ARCHIVED")
                              }
                              isLoading={actionLoading === course.id}
                              disabled={actionLoading === course.id}
                            >
                              <Archive className="h-3.5 w-3.5 mr-1" />
                              Archive
                            </Button>
                          )}
                          {course.status === "ARCHIVED" && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                updateCourseStatus(course.id, "PUBLISHED")
                              }
                              isLoading={actionLoading === course.id}
                              disabled={actionLoading === course.id}
                            >
                              Republish
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={course.isFeatured ? "secondary" : "ghost"}
                            onClick={() =>
                              toggleFeatured(course.id, course.isFeatured)
                            }
                            disabled={actionLoading === course.id}
                          >
                            {course.isFeatured ? "Unfeature" : "Feature"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
