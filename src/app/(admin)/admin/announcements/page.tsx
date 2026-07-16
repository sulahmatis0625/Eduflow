"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Megaphone, Plus, Trash2, Edit2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  courseId: string | null;
  userId: string;
  createdAt: string;
  course: { id: string; title: string } | null;
  user: { id: string; name: string | null; email: string };
}

interface CourseOption {
  id: string;
  title: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCourseId, setFormCourseId] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch {
      // Failed to fetch announcements
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/courses?status=PUBLISHED");
      if (res.ok) {
        const data = await res.json();
        setCourses(
          (data.courses || []).map((c: { id: string; title: string }) => ({
            id: c.id,
            title: c.title,
          }))
        );
      }
    } catch {
      // Failed to fetch courses
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    fetchCourses();
  }, [fetchAnnouncements, fetchCourses]);

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormCourseId("");
  };

  const createAnnouncement = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          content: formContent,
          courseId: formCourseId || null,
        }),
      });
      if (res.ok) {
        setCreateModalOpen(false);
        resetForm();
        fetchAnnouncements();
      }
    } catch {
      // Failed to create announcement
    } finally {
      setFormLoading(false);
    }
  };

  const updateAnnouncement = async () => {
    if (!selectedAnnouncement || !formTitle.trim() || !formContent.trim())
      return;
    setFormLoading(true);
    try {
      const res = await fetch(
        `/api/admin/announcements/${selectedAnnouncement.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            content: formContent,
            courseId: formCourseId || null,
          }),
        }
      );
      if (res.ok) {
        setEditModalOpen(false);
        setSelectedAnnouncement(null);
        resetForm();
        fetchAnnouncements();
      }
    } catch {
      // Failed to update announcement
    } finally {
      setFormLoading(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      // Failed to delete announcement
    } finally {
      setActionLoading(null);
    }
  };

  const openEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormTitle(announcement.title);
    setFormContent(announcement.content);
    setFormCourseId(announcement.courseId || "");
    setEditModalOpen(true);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const courseSelectOptions = [
    { value: "", label: "Platform-wide (no specific course)" },
    ...courses.map((c) => ({ value: c.id, label: c.title })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Announcements
          </h1>
          <p className="text-text-tertiary mt-1">
            Create and manage platform announcements
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setCreateModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Announcements List */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-text-primary">
            All Announcements ({announcements.length})
          </h2>
        </div>
        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            </div>
          ) : announcements.length === 0 ? (
            <EmptyState
              icon={<Megaphone className="h-12 w-12" />}
              title="No announcements yet"
              description="Create your first announcement to communicate with your users."
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    resetForm();
                    setCreateModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Announcement
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="px-6 py-4 hover:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-text-primary">
                          {announcement.title}
                        </h3>
                        {announcement.course ? (
                          <Badge variant="info" size="sm">
                            {announcement.course.title}
                          </Badge>
                        ) : (
                          <Badge variant="purple" size="sm">
                            Platform-wide
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-text-muted">
                          By{" "}
                          {announcement.user.name || announcement.user.email}
                        </span>
                        <span className="text-xs text-text-muted">
                          {formatDate(announcement.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(announcement)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteAnnouncement(announcement.id)}
                        isLoading={actionLoading === announcement.id}
                        disabled={actionLoading === announcement.id}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          resetForm();
        }}
        title="New Announcement"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Announcement title"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
          />
          <Textarea
            label="Content"
            placeholder="Write your announcement content..."
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            rows={6}
          />
          <Select
            label="Target Course (optional)"
            options={courseSelectOptions}
            value={formCourseId}
            onChange={(e) => setFormCourseId(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={createAnnouncement}
              isLoading={formLoading}
              disabled={!formTitle.trim() || !formContent.trim() || formLoading}
            >
              Publish Announcement
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Announcement Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAnnouncement(null);
          resetForm();
        }}
        title="Edit Announcement"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Announcement title"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
          />
          <Textarea
            label="Content"
            placeholder="Write your announcement content..."
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            rows={6}
          />
          <Select
            label="Target Course (optional)"
            options={courseSelectOptions}
            value={formCourseId}
            onChange={(e) => setFormCourseId(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditModalOpen(false);
                setSelectedAnnouncement(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={updateAnnouncement}
              isLoading={formLoading}
              disabled={!formTitle.trim() || !formContent.trim() || formLoading}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
