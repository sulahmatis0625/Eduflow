"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { getGradeLabel, getGradeColor } from "@/lib/utils";
import {
  GraduationCap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Loader2,
  Users,
} from "lucide-react";

interface GradebookStudent {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  status: string;
  progress: number;
  quizAvg: number;
  quizAttempts: number;
  overallGrade: number;
  enrolledAt: string;
}

interface ClassroomGradebookProps {
  courseId: string;
}

type SortField = "name" | "progress" | "grade";
type SortDir = "asc" | "desc";

const statusBadgeVariant = (
  status: string
): "success" | "warning" | "danger" | "info" | "default" | "purple" => {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "default" | "purple"> = {
    ACTIVE: "success",
    APPROVED: "info",
    COMPLETED: "purple",
    PENDING: "warning",
    SUSPENDED: "danger",
  };
  return map[status] || "default";
};

export function ClassroomGradebook({ courseId }: ClassroomGradebookProps) {
  const [students, setStudents] = useState<GradebookStudent[]>([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    fetchGradebook();
  }, [courseId]);

  async function fetchGradebook() {
    try {
      const res = await fetch(`/api/classrooms/${courseId}/gradebook`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.gradebook);
        setTotalQuizzes(data.totalQuizzes);
      }
    } catch {
      console.error("Failed to fetch gradebook");
    } finally {
      setLoading(false);
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = (a.user.name || "").localeCompare(b.user.name || "");
          break;
        case "progress":
          cmp = a.progress - b.progress;
          break;
        case "grade":
          cmp = a.overallGrade - b.overallGrade;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [students, sortField, sortDir]);

  function handleExport() {
    alert("Export functionality will be available in a future update.");
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1 text-brand" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-brand" />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="h-12 w-12" />}
        title="No students to grade"
        description="Students will appear here once they enroll in your classroom."
      />
    );
  }

  // Summary stats
  const avgGrade =
    students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.overallGrade, 0) / students.length)
      : 0;
  const avgProgress =
    students.length > 0
      ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)
      : 0;
  const passingCount = students.filter((s) => s.overallGrade >= 70).length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-text-tertiary" />
            <span className="text-text-secondary">
              {students.length} {students.length === 1 ? "student" : "students"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">Avg Grade:</span>
            <span className={`font-semibold ${getGradeColor(avgGrade)}`}>
              {avgGrade}% ({getGradeLabel(avgGrade)})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">Avg Progress:</span>
            <span className="font-semibold text-text-primary">{avgProgress}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">Passing:</span>
            <span className="font-semibold text-brand">
              {passingCount}/{students.length}
            </span>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.06] text-xs font-medium text-text-tertiary uppercase tracking-wider">
            <div className="col-span-4">
              <button
                onClick={() => handleSort("name")}
                className="flex items-center hover:text-text-secondary transition-colors"
              >
                Student
                <SortIcon field="name" />
              </button>
            </div>
            <div className="col-span-2">
              <button
                onClick={() => handleSort("progress")}
                className="flex items-center hover:text-text-secondary transition-colors"
              >
                Progress
                <SortIcon field="progress" />
              </button>
            </div>
            <div className="col-span-2 text-center">Quiz Avg</div>
            <div className="col-span-2">
              <button
                onClick={() => handleSort("grade")}
                className="flex items-center hover:text-text-secondary transition-colors"
              >
                Overall Grade
                <SortIcon field="grade" />
              </button>
            </div>
            <div className="col-span-2 text-center">Status</div>
          </div>

          {/* Rows */}
          {sortedStudents.map((student) => (
            <div
              key={student.id}
              className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors"
            >
              {/* Student */}
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <Avatar
                  src={student.user.image}
                  name={student.user.name}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {student.user.name || "Unnamed"}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">
                    {student.user.email}
                  </p>
                </div>
              </div>

              {/* Progress */}
              <div className="col-span-2 flex items-center gap-2">
                <Progress
                  value={student.progress}
                  size="sm"
                  color="brand"
                  className="flex-1"
                />
                <span className="text-xs font-medium text-text-secondary w-10 text-right">
                  {Math.round(student.progress)}%
                </span>
              </div>

              {/* Quiz Avg */}
              <div className="col-span-2 text-center">
                {student.quizAttempts > 0 ? (
                  <span className={`text-sm font-semibold ${getGradeColor(student.quizAvg)}`}>
                    {student.quizAvg}%
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">No attempts</span>
                )}
              </div>

              {/* Overall Grade */}
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${getGradeColor(student.overallGrade)}`}>
                    {student.overallGrade}%
                  </span>
                  <Badge
                    variant={
                      student.overallGrade >= 90
                        ? "success"
                        : student.overallGrade >= 70
                          ? "info"
                          : student.overallGrade >= 60
                            ? "warning"
                            : "danger"
                    }
                    size="sm"
                  >
                    {getGradeLabel(student.overallGrade)}
                  </Badge>
                </div>
              </div>

              {/* Status */}
              <div className="col-span-2 text-center">
                <Badge variant={statusBadgeVariant(student.status)} size="sm">
                  {student.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
