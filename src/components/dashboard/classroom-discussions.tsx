"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  MessageSquare,
  Plus,
  X,
  Loader2,
  Pin,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";

interface UserInfo {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  discussionId: string;
  parentId: string | null;
  isAnswer: boolean;
  createdAt: string;
  updatedAt: string;
  user: UserInfo;
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  userId: string;
  courseId: string;
  isPinned: boolean;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  user: UserInfo;
  comments: Comment[];
  _count: { comments: number };
}

interface ClassroomDiscussionsProps {
  courseId: string;
}

export function ClassroomDiscussions({ courseId }: ClassroomDiscussionsProps) {
  const { data: session } = useSession();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const isInstructorOrAdmin =
    session?.user?.role === "INSTRUCTOR" || session?.user?.role === "ADMIN";

  useEffect(() => {
    fetchDiscussions();
  }, [courseId]);

  async function fetchDiscussions() {
    try {
      const res = await fetch(`/api/discussions?courseId=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setDiscussions(data);
      }
    } catch {
      console.error("Failed to fetch discussions");
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
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title: title.trim(), content: content.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create discussion.");
        return;
      }

      const newDiscussion = await res.json();
      // Add default fields for the new discussion
      newDiscussion.comments = newDiscussion.comments || [];
      newDiscussion._count = newDiscussion._count || { comments: 0 };
      newDiscussion.isPinned = newDiscussion.isPinned || false;
      newDiscussion.isResolved = newDiscussion.isResolved || false;
      setDiscussions((prev) => [newDiscussion, ...prev]);
      setTitle("");
      setContent("");
      setShowForm(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTogglePin(discussionId: string, currentPinned: boolean) {
    try {
      const res = await fetch(`/api/discussions/${discussionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !currentPinned }),
      });

      if (res.ok) {
        const updated = await res.json();
        setDiscussions((prev) =>
          prev
            .map((d) => (d.id === discussionId ? updated : d))
            .sort((a, b) => {
              if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
        );
      }
    } catch {
      console.error("Failed to toggle pin");
    }
  }

  async function handleToggleResolved(discussionId: string, currentResolved: boolean) {
    try {
      const res = await fetch(`/api/discussions/${discussionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: !currentResolved }),
      });

      if (res.ok) {
        const updated = await res.json();
        setDiscussions((prev) =>
          prev.map((d) => (d.id === discussionId ? updated : d))
        );
      }
    } catch {
      console.error("Failed to toggle resolved");
    }
  }

  async function handleAddComment(discussionId: string) {
    if (!commentText.trim()) return;

    setCommentSubmitting(true);
    try {
      const res = await fetch(`/api/discussions/${discussionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setDiscussions((prev) =>
          prev.map((d) => {
            if (d.id === discussionId) {
              return {
                ...d,
                comments: [...d.comments, newComment],
                _count: { comments: d._count.comments + 1 },
              };
            }
            return d;
          })
        );
        setCommentText("");
      }
    } catch {
      console.error("Failed to add comment");
    } finally {
      setCommentSubmitting(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatRelativeDate(date: string) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
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
      {/* New Discussion Button */}
      {!showForm && (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Discussion
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
                  Start a Discussion
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
                placeholder="What's your question or topic?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Textarea
                label="Content"
                name="content"
                placeholder="Provide details about your discussion..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex items-center gap-3">
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    "Post Discussion"
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

      {/* Discussions List */}
      {discussions.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title="No discussions yet"
          description="Start a discussion to engage with your classroom community."
          action={
            !showForm ? (
              <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Start First Discussion
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {discussions.map((discussion) => {
            const isExpanded = expandedId === discussion.id;

            return (
              <Card key={discussion.id}>
                <CardContent className="py-4">
                  {/* Discussion Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <Avatar
                          src={discussion.user.image}
                          name={discussion.user.name}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-text-primary">
                              {discussion.title}
                            </h4>
                            {discussion.isPinned && (
                              <Badge variant="warning" size="sm">
                                <Pin className="h-2.5 w-2.5 mr-1" />
                                Pinned
                              </Badge>
                            )}
                            {discussion.isResolved && (
                              <Badge variant="success" size="sm">
                                <CheckCircle className="h-2.5 w-2.5 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-text-tertiary">
                              {discussion.user.name || "Anonymous"}
                            </span>
                            <span className="text-xs text-text-muted">
                              {formatRelativeDate(discussion.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Comment count */}
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : discussion.id)
                          }
                          className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors px-2 py-1 rounded-md hover:bg-white/[0.04]"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          {discussion._count.comments}
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Discussion Content (always visible) */}
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line pl-11">
                      {discussion.content}
                    </p>

                    {/* Instructor Actions */}
                    {isInstructorOrAdmin && (
                      <div className="flex items-center gap-2 pl-11">
                        <button
                          onClick={() =>
                            handleTogglePin(discussion.id, discussion.isPinned)
                          }
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                            discussion.isPinned
                              ? "text-gold bg-gold/10 hover:bg-gold/20"
                              : "text-text-muted hover:text-text-secondary hover:bg-white/[0.04]"
                          }`}
                        >
                          <Pin className="h-3 w-3" />
                          {discussion.isPinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          onClick={() =>
                            handleToggleResolved(
                              discussion.id,
                              discussion.isResolved
                            )
                          }
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors ${
                            discussion.isResolved
                              ? "text-brand bg-brand/10 hover:bg-brand/20"
                              : "text-text-muted hover:text-text-secondary hover:bg-white/[0.04]"
                          }`}
                        >
                          <CheckCircle className="h-3 w-3" />
                          {discussion.isResolved ? "Unresolve" : "Resolve"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded Comments Section */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/[0.06]">
                      {/* Comments List */}
                      {discussion.comments.length > 0 ? (
                        <div className="space-y-3 mb-4">
                          {discussion.comments.map((comment) => (
                            <div
                              key={comment.id}
                              className="flex items-start gap-2.5 pl-4"
                            >
                              <Avatar
                                src={comment.user.image}
                                name={comment.user.name}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-text-primary">
                                    {comment.user.name || "Anonymous"}
                                  </span>
                                  <span className="text-xs text-text-muted">
                                    {formatRelativeDate(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-text-secondary mt-0.5 whitespace-pre-line">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-text-muted text-center py-3 mb-4">
                          No comments yet. Be the first to reply.
                        </p>
                      )}

                      {/* Add Comment */}
                      {session?.user && (
                        <div className="flex items-start gap-2.5 pl-4">
                          <Avatar
                            src={session.user.image}
                            name={session.user.name}
                            size="sm"
                          />
                          <div className="flex-1 flex gap-2">
                            <Textarea
                              placeholder="Write a reply..."
                              value={expandedId === discussion.id ? commentText : ""}
                              onChange={(e) => setCommentText(e.target.value)}
                              rows={2}
                              className="flex-1"
                            />
                            <Button
                              variant="primary"
                              size="sm"
                              className="self-end flex-shrink-0"
                              disabled={
                                commentSubmitting || !commentText.trim()
                              }
                              onClick={() => handleAddComment(discussion.id)}
                            >
                              {commentSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
