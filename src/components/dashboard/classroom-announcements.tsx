"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Megaphone, Plus, X, Loader2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ClassroomAnnouncementsProps {
  courseId: string;
}

export function ClassroomAnnouncements({ courseId }: ClassroomAnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnnouncements();
  }, [courseId]);

  async function fetchAnnouncements() {
    try {
      const res = await fetch(`/api/classrooms/${courseId}/announcements`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch {
      console.error("Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/classrooms/${courseId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create announcement.");
        return;
      }

      const newAnnouncement = await res.json();
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      setTitle("");
      setContent("");
      setShowForm(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Announcement Button */}
      {!showForm && (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        </div>
      )}

      {/* Inline Form */}
      {showForm && (
        <Card className="border-brand/20 bg-brand/[0.02]">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                  Create Announcement
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setTitle("");
                    setContent("");
                    setError("");
                  }}
                  className="text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <Input
                label="Title"
                name="title"
                placeholder="Announcement title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Textarea
                label="Content"
                name="content"
                placeholder="Write your announcement..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    "Post Announcement"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setTitle("");
                    setContent("");
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

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-12 w-12" />}
          title="No announcements yet"
          description="Post announcements to keep your students informed about important updates."
          action={
            !showForm ? (
              <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Announcement
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <Megaphone className="h-4 w-4 text-brand flex-shrink-0" />
                      <h4 className="text-sm font-semibold text-text-primary truncate">
                        {announcement.title}
                      </h4>
                    </div>
                    <span className="text-xs text-text-tertiary whitespace-nowrap flex-shrink-0">
                      {formatDate(announcement.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-text-muted">
                    Posted by {announcement.user.name || "Instructor"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
