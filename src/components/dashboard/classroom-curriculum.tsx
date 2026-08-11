"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Layers,
  Plus,
  X,
  Loader2,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  CircleDot,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Clock,
  Check,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  type: string;
  content: string | null;
  videoUrl?: string | null;
  duration: number;
  order: number;
  sectionId: string;
  createdAt: string;
  updatedAt: string;
}

interface Section {
  id: string;
  title: string;
  order: number;
  courseId: string;
  createdAt: string;
  lessons: Lesson[];
}

const LESSON_TYPE_OPTIONS = [
  { value: "VIDEO", label: "Video (YouTube URL)" },
  { value: "FILE", label: "PDF / File" },
  { value: "QUIZ", label: "Quiz" },
];

const LESSON_TYPE_ICONS: Record<string, typeof Video> = {
  VIDEO: Video,
  FILE: FileText,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
  LIVE: CircleDot,
};

interface ClassroomCurriculumProps {
  courseId: string;
}

export function ClassroomCurriculum({ courseId }: ClassroomCurriculumProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Section form state
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [submittingSection, setSubmittingSection] = useState(false);

  // Section edit state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState("");
  const [savingSection, setSavingSection] = useState(false);

  // Section delete state
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);

  // Lesson form state
  const [showLessonFormForSection, setShowLessonFormForSection] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonFileUrl, setLessonFileUrl] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
  const [submittingLesson, setSubmittingLesson] = useState(false);

  // Lesson edit state
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonType, setEditLessonType] = useState("VIDEO");
  const [editLessonContent, setEditLessonContent] = useState("");
  const [editLessonDuration, setEditLessonDuration] = useState("");
  const [savingLesson, setSavingLesson] = useState(false);

  // Lesson delete state
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    fetchSections();
  }, [courseId]);

  async function fetchSections() {
    try {
      const res = await fetch(`/api/classrooms/${courseId}/sections`);
      if (res.ok) {
        const data = await res.json();
        setSections(data);
        // Expand all sections by default
        setExpandedSections(new Set(data.map((s: Section) => s.id)));
      }
    } catch {
      console.error("Failed to fetch sections");
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(sectionId: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  // --- Section CRUD ---

  async function handleCreateSection(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!sectionTitle.trim()) {
      setError("Section title is required.");
      return;
    }

    setSubmittingSection(true);
    try {
      const res = await fetch(`/api/classrooms/${courseId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sectionTitle.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create section.");
        return;
      }

      const newSection = await res.json();
      setSections((prev) => [...prev, newSection]);
      setExpandedSections((prev) => new Set([...prev, newSection.id]));
      setSectionTitle("");
      setShowSectionForm(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmittingSection(false);
    }
  }

  function startEditSection(section: Section) {
    setEditingSectionId(section.id);
    setEditSectionTitle(section.title);
  }

  async function handleUpdateSection(sectionId: string) {
    if (!editSectionTitle.trim()) return;

    setSavingSection(true);
    try {
      const res = await fetch(`/api/classrooms/${courseId}/sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editSectionTitle.trim() }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSections((prev) =>
          prev.map((s) => (s.id === sectionId ? updated : s))
        );
        setEditingSectionId(null);
      }
    } catch {
      console.error("Failed to update section");
    } finally {
      setSavingSection(false);
    }
  }

  async function handleDeleteSection(sectionId: string) {
    setDeletingSectionId(sectionId);
    try {
      const res = await fetch(`/api/classrooms/${courseId}/sections/${sectionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
      }
    } catch {
      console.error("Failed to delete section");
    } finally {
      setDeletingSectionId(null);
    }
  }

  // --- Lesson CRUD ---

  function openLessonForm(sectionId: string) {
    setShowLessonFormForSection(sectionId);
    setLessonTitle("");
    setLessonType("");
    setLessonVideoUrl("");
    setLessonFileUrl("");
    setLessonDuration("");
    setError("");
    setExpandedSections((prev) => new Set([...prev, sectionId]));
  }

  async function handleCreateLesson(e: React.FormEvent, sectionId: string) {
    e.preventDefault();
    setError("");

    if (!lessonType) {
      setError("Choose a lesson type first.");
      return;
    }
    if (!lessonTitle.trim()) {
      setError("Lesson title is required.");
      return;
    }
    if (lessonType === "VIDEO" && !lessonVideoUrl.trim()) {
      setError("Paste a YouTube video URL.");
      return;
    }
    if (lessonType === "FILE" && !lessonFileUrl.trim()) {
      setError("Paste a PDF or file URL.");
      return;
    }

    setSubmittingLesson(true);
    try {
      const payload: Record<string, unknown> = {
        title: lessonTitle.trim(),
        type: lessonType === "FILE" ? "FILE" : lessonType,
        sectionId,
        duration: lessonDuration ? parseInt(lessonDuration, 10) : 0,
      };
      if (lessonType === "VIDEO") {
        payload.videoUrl = lessonVideoUrl.trim();
      }
      if (lessonType === "FILE") {
        payload.videoUrl = lessonFileUrl.trim();
        payload.content = lessonFileUrl.trim();
      }

      const res = await fetch(`/api/classrooms/${courseId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create lesson.");
        return;
      }

      const newLesson = await res.json();
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, lessons: [...s.lessons, newLesson] } : s
        )
      );
      setShowLessonFormForSection(null);
      setLessonTitle("");
      setLessonType("");
      setLessonVideoUrl("");
      setLessonFileUrl("");
      setLessonDuration("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmittingLesson(false);
    }
  }

  function startEditLesson(lesson: Lesson) {
    setEditingLessonId(lesson.id);
    setEditLessonTitle(lesson.title);
    const normalizedType =
      lesson.type === "VIDEO" || lesson.type === "FILE" || lesson.type === "QUIZ"
        ? lesson.type
        : lesson.videoUrl
          ? "VIDEO"
          : "FILE";
    setEditLessonType(normalizedType);
    setEditLessonContent(lesson.videoUrl || lesson.content || "");
    setEditLessonDuration(lesson.duration > 0 ? String(lesson.duration) : "");
  }

  async function handleUpdateLesson(lessonId: string) {
    if (!editLessonTitle.trim()) return;

    setSavingLesson(true);
    try {
      const res = await fetch(`/api/classrooms/${courseId}/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editLessonTitle.trim(),
          type: editLessonType,
          videoUrl:
            editLessonType === "VIDEO" || editLessonType === "FILE"
              ? editLessonContent.trim()
              : null,
          content:
            editLessonType === "FILE" ? editLessonContent.trim() : undefined,
          duration: editLessonDuration ? parseInt(editLessonDuration, 10) : 0,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSections((prev) =>
          prev.map((s) => ({
            ...s,
            lessons: s.lessons.map((l) => (l.id === lessonId ? updated : l)),
          }))
        );
        setEditingLessonId(null);
      }
    } catch {
      console.error("Failed to update lesson");
    } finally {
      setSavingLesson(false);
    }
  }

  async function handleDeleteLesson(lessonId: string, sectionId: string) {
    setDeletingLessonId(lessonId);
    try {
      const res = await fetch(`/api/classrooms/${courseId}/lessons/${lessonId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSections((prev) =>
          prev.map((s) =>
            s.id === sectionId
              ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }
              : s
          )
        );
      }
    } catch {
      console.error("Failed to delete lesson");
    } finally {
      setDeletingLessonId(null);
    }
  }

  // --- Loading state ---

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  // --- Render ---

  return (
    <div className="space-y-4">
      {/* Add Section Button */}
      {!showSectionForm && (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setShowSectionForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
        </div>
      )}

      {/* Add Section Form */}
      {showSectionForm && (
        <Card className="border-brand/20 bg-brand/[0.02]">
          <CardContent>
            <form onSubmit={handleCreateSection} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                  New Section
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowSectionForm(false);
                    setSectionTitle("");
                    setError("");
                  }}
                  className="text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <Input
                label="Section Title"
                name="sectionTitle"
                placeholder="e.g., Introduction to the Course"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
              />

              {error && showSectionForm && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit" variant="primary" size="sm" isLoading={submittingSection}>
                  {submittingSection ? "Creating..." : "Create Section"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSectionForm(false);
                    setSectionTitle("");
                    setError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sections list */}
      {sections.length === 0 && !showSectionForm ? (
        <EmptyState
          icon={<Layers className="h-12 w-12" />}
          title="No sections yet"
          description="Add sections and lessons to build your classroom curriculum."
          action={
            <Button variant="outline" size="sm" onClick={() => setShowSectionForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Section
            </Button>
          }
        />
      ) : (
        sections.map((section, sIndex) => {
          const isExpanded = expandedSections.has(section.id);
          const isEditing = editingSectionId === section.id;
          const isDeleting = deletingSectionId === section.id;

          return (
            <Card key={section.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className="text-text-tertiary hover:text-text-secondary transition-colors flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand/10 text-brand text-sm font-bold flex-shrink-0">
                      {sIndex + 1}
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          name="editSectionTitle"
                          value={editSectionTitle}
                          onChange={(e) => setEditSectionTitle(e.target.value)}
                          placeholder="Section title"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUpdateSection(section.id)}
                          isLoading={savingSection}
                        >
                          <Check className="h-4 w-4 text-green-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingSectionId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-text-primary truncate">
                          {section.title}
                        </h3>
                        <p className="text-xs text-text-tertiary">
                          {section.lessons.length}{" "}
                          {section.lessons.length === 1 ? "lesson" : "lessons"}
                        </p>
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditSection(section)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-text-tertiary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSection(section.id)}
                        isLoading={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="py-2">
                  <div className="space-y-1">
                    {section.lessons.map((lesson, lIndex) => {
                      const LessonIcon = LESSON_TYPE_ICONS[lesson.type] || FileText;
                      const isEditingLesson = editingLessonId === lesson.id;
                      const isDeletingLesson = deletingLessonId === lesson.id;

                      if (isEditingLesson) {
                        return (
                          <div
                            key={lesson.id}
                            className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-text-tertiary">
                                Edit Lesson
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingLessonId(null)}
                                className="text-text-tertiary hover:text-text-secondary transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <Input
                              label="Title"
                              name="editLessonTitle"
                              value={editLessonTitle}
                              onChange={(e) => setEditLessonTitle(e.target.value)}
                            />
                            <Select
                              label="Type"
                              options={LESSON_TYPE_OPTIONS}
                              value={editLessonType}
                              onChange={(e) => setEditLessonType(e.target.value)}
                            />
                            {editLessonType === "VIDEO" && (
                              <Input
                                label="YouTube video URL"
                                value={editLessonContent}
                                onChange={(e) =>
                                  setEditLessonContent(e.target.value)
                                }
                                placeholder="https://www.youtube.com/watch?v=..."
                              />
                            )}
                            {editLessonType === "FILE" && (
                              <Input
                                label="PDF / file URL"
                                value={editLessonContent}
                                onChange={(e) =>
                                  setEditLessonContent(e.target.value)
                                }
                                placeholder="https://.../document.pdf"
                              />
                            )}
                            {(editLessonType === "VIDEO" ||
                              editLessonType === "FILE") && (
                              <Input
                                label="Duration (min)"
                                name="editLessonDuration"
                                type="number"
                                placeholder="0"
                                value={editLessonDuration}
                                onChange={(e) =>
                                  setEditLessonDuration(e.target.value)
                                }
                              />
                            )}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleUpdateLesson(lesson.id)}
                                isLoading={savingLesson}
                              >
                                {savingLesson ? "Saving..." : "Save Changes"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingLessonId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.03] transition-colors group"
                        >
                          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-white/[0.06] text-text-tertiary flex-shrink-0">
                            <LessonIcon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm text-text-secondary flex-1 truncate">
                            {lIndex + 1}. {lesson.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" size="sm">
                              {lesson.type}
                            </Badge>
                            {lesson.duration > 0 && (
                              <span className="text-xs text-text-tertiary flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lesson.duration}m
                              </span>
                            )}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditLesson(lesson)}
                              >
                                <Pencil className="h-3 w-3 text-text-tertiary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteLesson(lesson.id, section.id)}
                                isLoading={isDeletingLesson}
                              >
                                <Trash2 className="h-3 w-3 text-red-400" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Lesson form */}
                    {showLessonFormForSection === section.id ? (
                      <div className="mt-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <form
                          onSubmit={(e) => handleCreateLesson(e, section.id)}
                          className="space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-text-tertiary">
                              New Lesson
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowLessonFormForSection(null);
                                setError("");
                              }}
                              className="text-text-tertiary hover:text-text-secondary transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <Select
                            label="Lesson type"
                            options={[
                              { value: "", label: "Select type…" },
                              ...LESSON_TYPE_OPTIONS,
                            ]}
                            value={lessonType}
                            onChange={(e) => {
                              setLessonType(e.target.value);
                              setError("");
                            }}
                          />

                          {lessonType && (
                            <>
                              <Input
                                label="Lesson Title"
                                name="lessonTitle"
                                placeholder="e.g., Getting Started"
                                value={lessonTitle}
                                onChange={(e) => setLessonTitle(e.target.value)}
                              />

                              {lessonType === "VIDEO" && (
                                <Input
                                  label="YouTube video URL"
                                  name="lessonVideoUrl"
                                  placeholder="https://www.youtube.com/watch?v=..."
                                  value={lessonVideoUrl}
                                  onChange={(e) =>
                                    setLessonVideoUrl(e.target.value)
                                  }
                                />
                              )}

                              {lessonType === "FILE" && (
                                <Input
                                  label="PDF / file URL"
                                  name="lessonFileUrl"
                                  placeholder="https://.../document.pdf"
                                  value={lessonFileUrl}
                                  onChange={(e) =>
                                    setLessonFileUrl(e.target.value)
                                  }
                                />
                              )}

                              {lessonType === "QUIZ" && (
                                <p className="text-xs text-text-muted">
                                  Creates a quiz lesson placeholder. Build the
                                  full quiz (questions &amp; answers) in the{" "}
                                  <span className="text-brand">Assessments</span>{" "}
                                  tab.
                                </p>
                              )}

                              {(lessonType === "VIDEO" ||
                                lessonType === "FILE") && (
                                <Input
                                  label="Duration (min)"
                                  name="lessonDuration"
                                  type="number"
                                  placeholder="Optional"
                                  value={lessonDuration}
                                  onChange={(e) =>
                                    setLessonDuration(e.target.value)
                                  }
                                />
                              )}
                            </>
                          )}

                          {error && showLessonFormForSection === section.id && (
                            <p className="text-sm text-red-400">{error}</p>
                          )}

                          <div className="flex items-center gap-2">
                            <Button
                              type="submit"
                              variant="primary"
                              size="sm"
                              isLoading={submittingLesson}
                              disabled={!lessonType}
                            >
                              {submittingLesson ? "Adding..." : "Add Lesson"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShowLessonFormForSection(null);
                                setError("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openLessonForm(section.id)}
                        className="flex items-center gap-2 w-full py-2 px-2 mt-1 rounded-lg text-xs text-text-tertiary hover:text-text-secondary hover:bg-white/[0.03] transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Lesson
                      </button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
