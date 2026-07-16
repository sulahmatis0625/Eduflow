"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardList, Search, Eye, Trash2 } from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  timeLimit: number | null;
  passingScore: number;
  maxAttempts: number;
  isActive: boolean;
  createdAt: string;
  course: { id: string; title: string };
  _count: { questions: number; attempts: number };
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/quizzes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      }
    } catch {
      // Failed to fetch quizzes
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Quiz Management
        </h1>
        <p className="text-text-tertiary mt-1">
          View and manage quizzes across all courses
        </p>
      </div>

      {/* Search */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-6">
        <div className="w-full sm:w-96">
          <Input
            placeholder="Search quizzes by title or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Quizzes Table */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-text-primary">
            All Quizzes ({quizzes.length})
          </h2>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            </div>
          ) : quizzes.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-12 w-12" />}
              title="No quizzes found"
              description="No quizzes have been created yet. Quizzes are created by instructors within their courses."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Quiz
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Course
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Questions
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Attempts
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Pass Score
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs text-text-tertiary px-6 py-3">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((quiz) => (
                    <tr
                      key={quiz.id}
                      className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {quiz.title}
                          </p>
                          {quiz.description && (
                            <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">
                              {quiz.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {quiz.course.title}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-primary">
                          {quiz._count.questions}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-primary">
                          {quiz._count.attempts}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-primary">
                          {quiz.passingScore}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={quiz.isActive ? "success" : "danger"}>
                          {quiz.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">
                          {formatDate(quiz.createdAt)}
                        </span>
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
