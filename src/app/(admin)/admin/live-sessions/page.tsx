"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Video, ExternalLink } from "lucide-react";

interface LiveSessionItem {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  roomId: string;
  status: string;
  maxParticipants: number | null;
  createdAt: string;
  course: { id: string; title: string };
  _count: { attendance: number };
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "LIVE", label: "Live" },
  { value: "ENDED", label: "Ended" },
  { value: "CANCELLED", label: "Cancelled" },
];

const statusBadgeVariant = (status: string) => {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "default" | "purple"> = {
    SCHEDULED: "info",
    LIVE: "success",
    ENDED: "default",
    CANCELLED: "danger",
  };
  return map[status] || "default";
};

export default function AdminLiveSessionsPage() {
  const [sessions, setSessions] = useState<LiveSessionItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/live-sessions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // Failed to fetch sessions
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Live Session Management
        </h1>
        <p className="text-text-tertiary mt-1">
          View and manage live sessions across all courses
        </p>
      </div>

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

      {/* Sessions Table */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-text-primary">
            All Live Sessions ({sessions.length})
          </h2>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={<Video className="h-12 w-12" />}
              title="No live sessions found"
              description="No live sessions have been scheduled yet, or none match your current filter."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Session
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Course
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Start Time
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Duration
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Attendees
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr
                      key={session.id}
                      className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {session.title}
                          </p>
                          {session.description && (
                            <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">
                              {session.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {session.course.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusBadgeVariant(session.status)}>
                          {session.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {formatDate(session.startTime)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-primary">
                          {session.duration ? `${session.duration} min` : "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-primary">
                          {session._count.attendance}
                          {session.maxParticipants
                            ? ` / ${session.maxParticipants}`
                            : ""}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {session.status === "LIVE" && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() =>
                              window.open(`/live/${session.id}`, "_blank")
                            }
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Join
                          </Button>
                        )}
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
