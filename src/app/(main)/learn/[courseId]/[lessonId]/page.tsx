"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  Play, CheckCircle, ChevronLeft, ChevronRight, BookOpen,
  Clock, FileText, MessageSquare, Bookmark, BookmarkCheck,
  ChevronDown, ChevronUp, Lock, Video, PenLine, List,
  GraduationCap, Award,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  type: string;
  videoUrl: string | null;
  content: string | null;
  duration: number;
  order: number;
  isFree: boolean;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface CourseData {
  id: string;
  title: string;
  slug: string;
  sections: Section[];
  instructor: { name: string; image: string | null };
  enrollment: {
    progress: number;
    status: string;
  } | null;
  completedLessons: string[];
}

export default function LearnPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"content" | "notes" | "discussion">("content");
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState<{ courseId: string; lessonId: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;

    async function fetchData() {
      try {
        const res = await fetch(`/api/courses/${resolvedParams!.courseId}/learn`);
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          router.push("/courses");
          return;
        }
        const data = await res.json();
        setCourse(data);

        // Find current lesson
        for (const section of data.sections) {
          const lesson = section.lessons.find((l: Lesson) => l.id === resolvedParams!.lessonId);
          if (lesson) {
            setCurrentLesson(lesson);
            setExpandedSections(new Set([section.id]));
            break;
          }
        }

        setLoading(false);
      } catch {
        setLoading(false);
      }
    }

    fetchData();
  }, [resolvedParams, router]);

  const allLessons = course?.sections.flatMap((s) => s.lessons) || [];
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const markComplete = async () => {
    if (!currentLesson || !resolvedParams) return;
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: currentLesson.id, completed: true }),
    });
    if (course) {
      setCourse({
        ...course,
        completedLessons: [...course.completedLessons, currentLesson.id],
      });
    }
  };

  const navigateToLesson = (lessonId: string) => {
    if (!resolvedParams) return;
    router.push(`/learn/${resolvedParams.courseId}/${lessonId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0">
        <div className="animate-spin h-8 w-8 border-2 border-brand border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-0 text-text-primary">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-text-tertiary" />
          <h2 className="text-xl font-semibold mb-2">Course not found</h2>
          <Link href="/courses"><Button>Browse Courses</Button></Link>
        </div>
      </div>
    );
  }

  const isCompleted = course.completedLessons.includes(currentLesson.id);
  const completedCount = course.completedLessons.length;
  const totalCount = allLessons.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface-0 text-text-primary flex flex-col">
      {/* Top Bar */}
      <div className="h-14 bg-surface-1 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/courses/${course.slug}`} className="p-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="hidden sm:block">
            <h1 className="text-sm font-medium truncate max-w-md">{course.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <Progress value={progressPercent} size="sm" className="w-32" />
            <span className="text-xs text-text-muted">{progressPercent}%</span>
          </div>
          <Button
            size="sm"
            variant={isCompleted ? "success" : "primary"}
            onClick={markComplete}
            disabled={isCompleted}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {isCompleted ? "Completed" : "Mark Complete"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Video/Content Area */}
          <div className="bg-black aspect-video max-h-[60vh] flex items-center justify-center relative">
            {currentLesson.type === "VIDEO" ? (
              currentLesson.videoUrl ? (
                <video
                  src={currentLesson.videoUrl}
                  controls
                  className="w-full h-full"
                  autoPlay
                />
              ) : (
                <div className="text-center">
                  <Video className="h-16 w-16 mx-auto mb-4 text-text-muted" />
                  <p className="text-text-tertiary">Video content will be available here</p>
                  <p className="text-sm text-text-muted mt-1">Demo mode - no video file attached</p>
                </div>
              )
            ) : currentLesson.type === "TEXT" ? (
              <div className="w-full h-full overflow-y-auto p-8 bg-surface-0">
                <div className="max-w-3xl mx-auto prose prose-invert">
                  <h2>{currentLesson.title}</h2>
                  <div dangerouslySetInnerHTML={{ __html: currentLesson.content || "<p>No content available.</p>" }} />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-text-muted" />
                <p className="text-text-tertiary">{currentLesson.type} Lesson</p>
              </div>
            )}
          </div>

          {/* Lesson Info & Tabs */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={currentLesson.type === "VIDEO" ? "info" : currentLesson.type === "QUIZ" ? "warning" : "default"}>
                {currentLesson.type}
              </Badge>
              {currentLesson.duration > 0 && (
                <span className="text-sm text-text-tertiary flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {currentLesson.duration} min
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold mb-4">{currentLesson.title}</h2>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/[0.06] mb-4">
              {[
                { id: "content" as const, label: "Overview", icon: FileText },
                { id: "notes" as const, label: "Notes", icon: PenLine },
                { id: "discussion" as const, label: "Discussion", icon: MessageSquare },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-brand text-brand"
                      : "border-transparent text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "content" && (
              <div className="text-text-secondary">
                <p>{currentLesson.description || "No description available for this lesson."}</p>
              </div>
            )}

            {activeTab === "notes" && (
              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take notes for this lesson..."
                  className="w-full h-40 bg-surface-1 border border-white/[0.06] rounded-lg p-4 text-text-secondary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <p className="text-xs text-text-muted mt-2">Notes are saved locally in this session.</p>
              </div>
            )}

            {activeTab === "discussion" && (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-text-muted" />
                <p className="text-text-tertiary text-sm">Discussion forum for this lesson</p>
                <Link href={`/courses/${course.slug}#discussions`}>
                  <Button variant="outline" size="sm" className="mt-3">Open Course Discussions</Button>
                </Link>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
              <div>
                {prevLesson && (
                  <button onClick={() => navigateToLesson(prevLesson.id)} className="flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                    <div className="text-left">
                      <p className="text-xs text-text-muted">Previous</p>
                      <p className="truncate max-w-[200px]">{prevLesson.title}</p>
                    </div>
                  </button>
                )}
              </div>
              <div>
                {nextLesson ? (
                  <button onClick={() => navigateToLesson(nextLesson.id)} className="flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary transition-colors">
                    <div className="text-right">
                      <p className="text-xs text-text-muted">Next</p>
                      <p className="truncate max-w-[200px]">{nextLesson.title}</p>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <Link href="/dashboard/certificates">
                    <Button size="sm" variant="success">
                      <Award className="h-4 w-4 mr-1" /> View Certificate
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Course Curriculum */}
        <div className={`${sidebarOpen ? "w-80" : "w-0"} border-l border-white/[0.06] bg-surface-1 overflow-y-auto transition-all shrink-0`}>
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Course Content</h3>
              <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-white/[0.03] rounded lg:hidden">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={progressPercent} size="sm" className="flex-1" color="brand" />
              <span className="text-xs text-text-muted">{completedCount}/{totalCount}</span>
            </div>
          </div>

          {course.sections.map((section) => (
            <div key={section.id} className="border-b border-white/[0.06]">
              <button
                onClick={() => {
                  const next = new Set(expandedSections);
                  if (next.has(section.id)) next.delete(section.id);
                  else next.add(section.id);
                  setExpandedSections(next);
                }}
                className="w-full flex items-center justify-between p-3 hover:bg-white/[0.03] transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-medium">{section.title}</p>
                  <p className="text-xs text-text-muted">
                    {section.lessons.filter((l) => course.completedLessons.includes(l.id)).length}/{section.lessons.length} lessons
                  </p>
                </div>
                {expandedSections.has(section.id) ? (
                  <ChevronUp className="h-4 w-4 text-text-tertiary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-tertiary" />
                )}
              </button>

              {expandedSections.has(section.id) && (
                <div className="pb-2">
                  {section.lessons.map((lesson) => {
                    const isActive = lesson.id === currentLesson.id;
                    const isLessonCompleted = course.completedLessons.includes(lesson.id);

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => navigateToLesson(lesson.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isActive
                            ? "bg-brand/20 text-brand border-l-2 border-brand"
                            : "text-text-tertiary hover:bg-white/[0.03] hover:text-text-secondary"
                        }`}
                      >
                        {isLessonCompleted ? (
                          <CheckCircle className="h-4 w-4 text-brand shrink-0" />
                        ) : isActive ? (
                          <Play className="h-4 w-4 text-brand shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-white/[0.06] shrink-0" />
                        )}
                        <span className="truncate text-left">{lesson.title}</span>
                        {lesson.duration > 0 && (
                          <span className="text-xs text-text-muted ml-auto shrink-0">{lesson.duration}m</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Toggle sidebar button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-surface-2 p-2 rounded-l-lg hover:bg-surface-3"
          >
            <List className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
