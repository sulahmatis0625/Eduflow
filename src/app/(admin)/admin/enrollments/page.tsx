"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { FileCheck, CheckCircle, XCircle } from "lucide-react";

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  progress: number;
  grade: number | null;
  enrolledAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  user: { id: string; name: string | null; email: string; image: string | null };
  course: { id: string; title: string; slug: string };
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "SUSPENDED", label: "Suspended" },
];

const statusBadgeVariant = (status: string) => {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "default" | "purple"> = {
    COMPLETED: "success",
    ACTIVE: "success",
    APPROVED: "info",
    PENDING: "warning",
    SUSPENDED: "danger",
  };
  return map[status] || "default";
};

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/enrollments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
      }
    } catch {
      // Failed to fetch enrollments
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const updateEnrollment = async (enrollmentId: string, newStatus: string) => {
    setActionLoading(enrollmentId);
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setEnrollments((prev) =>
          prev.map((e) =>
            e.id === enrollmentId
              ? {
                  ...e,
                  status: newStatus,
                  approvedAt:
                    newStatus === "APPROVED"
                      ? new Date().toISOString()
                      : e.approvedAt,
                }
              : e
          )
        );
      }
    } catch {
      // Failed to update enrollment
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const pendingCount = enrollments.filter(
    (e) => e.status === "PENDING"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Enrollment Management
        </h1>
        <p className="text-text-tertiary mt-1">
          Review and manage student enrollments
        </p>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="bg-gold/10 border border-gold/20 rounded-xl p-4">
          <p className="text-sm text-gold">
            <span className="font-semibold">{pendingCount}</span> enrollment
            {pendingCount !== 1 ? "s" : ""} pending approval
          </p>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-full sm:w-64">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-text-primary">
            Enrollments ({enrollments.length})
          </h2>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            </div>
          ) : enrollments.length === 0 ? (
            <EmptyState
              icon={<FileCheck className="h-12 w-12" />}
              title="No enrollments found"
              description="No enrollments match your current filter."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Student
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Course
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Progress
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Enrolled
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={enrollment.user.image}
                            name={enrollment.user.name}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              {enrollment.user.name || "Unnamed"}
                            </p>
                            <p className="text-xs text-text-tertiary">
                              {enrollment.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-primary">
                          {enrollment.course.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={statusBadgeVariant(enrollment.status)}
                        >
                          {enrollment.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-white/[0.06] rounded-full h-2">
                            <div
                              className="bg-brand h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.min(enrollment.progress, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-text-tertiary">
                            {Math.round(enrollment.progress)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {formatDate(enrollment.enrolledAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {enrollment.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() =>
                                  updateEnrollment(enrollment.id, "APPROVED")
                                }
                                isLoading={actionLoading === enrollment.id}
                                disabled={actionLoading === enrollment.id}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() =>
                                  updateEnrollment(enrollment.id, "SUSPENDED")
                                }
                                isLoading={actionLoading === enrollment.id}
                                disabled={actionLoading === enrollment.id}
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {enrollment.status === "APPROVED" && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                updateEnrollment(enrollment.id, "ACTIVE")
                              }
                              isLoading={actionLoading === enrollment.id}
                              disabled={actionLoading === enrollment.id}
                            >
                              Activate
                            </Button>
                          )}
                          {enrollment.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateEnrollment(enrollment.id, "SUSPENDED")
                              }
                              isLoading={actionLoading === enrollment.id}
                              disabled={actionLoading === enrollment.id}
                            >
                              Suspend
                            </Button>
                          )}
                          {enrollment.status === "SUSPENDED" && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() =>
                                updateEnrollment(enrollment.id, "ACTIVE")
                              }
                              isLoading={actionLoading === enrollment.id}
                              disabled={actionLoading === enrollment.id}
                            >
                              Reactivate
                            </Button>
                          )}
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
