"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Video, VideoOff, Mic, MicOff, Monitor, MessageSquare,
  Phone, Users, Hand, Send, ChevronLeft,
  Maximize, Minimize, ScreenShare, HelpCircle, ThumbsUp,
  CheckCircle2, LogOut,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionData {
  id: string;
  title: string;
  status: string;
  course: {
    id: string;
    title: string;
    instructorId: string;
    instructor: { id: string; name: string | null; image: string | null };
  };
  attendance: {
    id: string;
    userId: string;
    user: { id: string; name: string | null; image: string | null; role: string };
  }[];
  chatMessages: { id: string; userName: string; message: string; sentAt: string }[];
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
}

interface BoardQuestion {
  id: string;
  text: string;
  authorName: string;
  authorId: string;
  votes: number;
  votedBy: string[];
  answered: boolean;
  createdAt: number;
}

type SidebarTab = "chat" | "participants" | "questions";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LiveSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { data: session } = useSession();

  // Resolved route params
  const [resolvedParams, setResolvedParams] = useState<{ sessionId: string } | null>(null);

  // Session data from API
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Media controls
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);

  // Sidebar
  const [activeTab, setActiveTab] = useState<SidebarTab>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", user: "System", text: "Welcome to the live session!", time: new Date().toLocaleTimeString() },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Question Board
  const [questions, setQuestions] = useState<BoardQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState("");

  // End-class loading state
  const [endingClass, setEndingClass] = useState(false);

  // -----------------------------------------------------------------------
  // Resolve params
  // -----------------------------------------------------------------------
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // -----------------------------------------------------------------------
  // Fetch session data on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!resolvedParams) return;

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/live/${resolvedParams.sessionId}`);
        if (res.ok) {
          const data: SessionData = await res.json();
          setSessionData(data);

          // Seed chat from DB messages
          if (data.chatMessages?.length) {
            const dbMessages: ChatMessage[] = data.chatMessages.map((m) => ({
              id: m.id,
              user: m.userName,
              text: m.message,
              time: new Date(m.sentAt).toLocaleTimeString(),
            }));
            setMessages((prev) => {
              // Keep the welcome message, append DB messages
              const welcome = prev.find((m) => m.id === "1");
              return welcome ? [welcome, ...dbMessages] : dbMessages;
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch session:", err);
      } finally {
        setLoadingSession(false);
      }
    };

    fetchSession();
  }, [resolvedParams]);

  // -----------------------------------------------------------------------
  // Scroll chat
  // -----------------------------------------------------------------------
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------
  const instructor = sessionData?.course?.instructor;
  const isInstructor = session?.user?.id === sessionData?.course?.instructorId;
  const isAdmin = session?.user?.role === "ADMIN";
  const canManage = isInstructor || isAdmin;

  const participants = sessionData
    ? sessionData.attendance.map((a) => ({
        id: a.userId,
        name: a.user.name || "Unknown",
        role: a.userId === sessionData.course.instructorId ? "Instructor" : "Student",
        image: a.user.image,
      }))
    : [
        { id: "instructor", name: instructor?.name || "Instructor", role: "Instructor" as const, image: instructor?.image || null },
        { id: session?.user?.id || "you", name: session?.user?.name || "You", role: "Student" as const, image: session?.user?.image || null },
      ];

  const sessionTitle = sessionData?.title || "Live Session";
  const courseTitle = sessionData?.course?.title;

  // -----------------------------------------------------------------------
  // Chat
  // -----------------------------------------------------------------------
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        user: session?.user?.name || "You",
        text: newMessage,
        time: new Date().toLocaleTimeString(),
      },
    ]);
    setNewMessage("");
  };

  // -----------------------------------------------------------------------
  // Question Board
  // -----------------------------------------------------------------------
  const submitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const q: BoardQuestion = {
      id: Date.now().toString(),
      text: newQuestion.trim(),
      authorName: session?.user?.name || "Anonymous",
      authorId: session?.user?.id || "",
      votes: 0,
      votedBy: [],
      answered: false,
      createdAt: Date.now(),
    };

    setQuestions((prev) => [q, ...prev]);
    setNewQuestion("");
  };

  const upvoteQuestion = useCallback(
    (qId: string) => {
      const userId = session?.user?.id || "";
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id !== qId) return q;
          const alreadyVoted = q.votedBy.includes(userId);
          return {
            ...q,
            votes: alreadyVoted ? q.votes - 1 : q.votes + 1,
            votedBy: alreadyVoted
              ? q.votedBy.filter((id) => id !== userId)
              : [...q.votedBy, userId],
          };
        })
      );
    },
    [session?.user?.id]
  );

  const markAnswered = useCallback((qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, answered: !q.answered } : q))
    );
  }, []);

  // Sorted: unanswered first sorted by votes desc, then answered sorted by votes desc
  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.answered !== b.answered) return a.answered ? 1 : -1;
    if (b.votes !== a.votes) return b.votes - a.votes;
    return b.createdAt - a.createdAt;
  });

  // -----------------------------------------------------------------------
  // End class
  // -----------------------------------------------------------------------
  const handleEndClass = async () => {
    if (!resolvedParams || !confirm("Are you sure you want to end this class?")) return;
    setEndingClass(true);
    try {
      await fetch(`/api/live/${resolvedParams.sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ENDED" }),
      });
      window.history.back();
    } catch (err) {
      console.error("Failed to end class:", err);
      setEndingClass(false);
    }
  };

  // -----------------------------------------------------------------------
  // Sidebar tab helpers
  // -----------------------------------------------------------------------
  const openTab = (tab: SidebarTab) => {
    if (activeTab === tab && sidebarOpen) {
      setSidebarOpen(false);
    } else {
      setActiveTab(tab);
      setSidebarOpen(true);
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-surface-0 text-text-primary flex flex-col">
      {/* Top Bar */}
      <div className="h-14 bg-surface-1 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-sm font-medium">{sessionTitle}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="danger" size="sm">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse mr-1" />
                LIVE
              </Badge>
              {courseTitle && (
                <span className="text-xs text-text-muted">{courseTitle}</span>
              )}
              <span className="text-xs text-text-tertiary">
                {participants.length} participant{participants.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant={isFullscreen ? "primary" : "ghost"}
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          {canManage && (
            <Button
              size="sm"
              variant="danger"
              onClick={handleEndClass}
              isLoading={endingClass}
            >
              <LogOut className="h-4 w-4 mr-1" /> End Class
            </Button>
          )}

          <Button size="sm" variant="secondary" onClick={() => window.history.back()}>
            <Phone className="h-4 w-4 mr-1" /> Leave
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Grid */}
          <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Instructor Video (Main) */}
            <div className="col-span-1 md:col-span-2 bg-surface-2 rounded-2xl overflow-hidden relative aspect-video max-h-[60vh]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Avatar name={instructor?.name || "Instructor"} src={instructor?.image} size="xl" />
                  <p className="mt-3 font-medium">{instructor?.name || "Instructor"}</p>
                  <p className="text-sm text-text-tertiary">Instructor</p>
                </div>
              </div>
              {screenSharing && (
                <div className="absolute top-3 left-3">
                  <Badge variant="info"><ScreenShare className="h-3 w-3 mr-1" /> Screen Sharing</Badge>
                </div>
              )}
              <div className="absolute bottom-3 left-3">
                <Badge variant="default">{instructor?.name || "Instructor"}</Badge>
              </div>
            </div>

            {/* Your Video (Small) */}
            <div className="absolute bottom-20 right-4 w-48 h-36 bg-surface-2 rounded-xl overflow-hidden border-2 border-white/[0.06] z-10">
              <div className="w-full h-full flex items-center justify-center">
                {videoOn ? (
                  <div className="text-center">
                    <Avatar src={session?.user?.image} name={session?.user?.name} size="lg" />
                  </div>
                ) : (
                  <div className="text-center">
                    <VideoOff className="h-8 w-8 text-text-muted mx-auto" />
                    <p className="text-xs text-text-muted mt-1">Camera off</p>
                  </div>
                )}
              </div>
              <div className="absolute bottom-2 left-2">
                <span className="text-xs bg-surface-0/80 px-2 py-0.5 rounded">You</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="h-16 bg-surface-1 border-t border-white/[0.06] flex items-center justify-center gap-3 px-4 shrink-0">
            <Button
              size="icon"
              variant={audioOn ? "secondary" : "danger"}
              onClick={() => setAudioOn(!audioOn)}
              className="rounded-full h-12 w-12"
            >
              {audioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            <Button
              size="icon"
              variant={videoOn ? "secondary" : "danger"}
              onClick={() => setVideoOn(!videoOn)}
              className="rounded-full h-12 w-12"
            >
              {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            <Button
              size="icon"
              variant={screenSharing ? "primary" : "secondary"}
              onClick={() => setScreenSharing(!screenSharing)}
              className="rounded-full h-12 w-12"
            >
              <Monitor className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant={handRaised ? "primary" : "secondary"}
              onClick={() => setHandRaised(!handRaised)}
              className="rounded-full h-12 w-12"
            >
              <Hand className="h-5 w-5" />
            </Button>
            <div className="w-px h-8 bg-white/[0.06] mx-1" />
            <Button
              size="icon"
              variant={sidebarOpen && activeTab === "chat" ? "primary" : "secondary"}
              onClick={() => openTab("chat")}
              className="rounded-full h-12 w-12"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant={sidebarOpen && activeTab === "participants" ? "primary" : "secondary"}
              onClick={() => openTab("participants")}
              className="rounded-full h-12 w-12"
            >
              <Users className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant={sidebarOpen && activeTab === "questions" ? "primary" : "secondary"}
              onClick={() => openTab("questions")}
              className="rounded-full h-12 w-12 relative"
            >
              <HelpCircle className="h-5 w-5" />
              {questions.filter((q) => !q.answered).length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brand text-[10px] font-bold flex items-center justify-center text-surface-0">
                  {questions.filter((q) => !q.answered).length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-80 border-l border-white/[0.06] bg-surface-1 flex flex-col shrink-0">
            {/* Tab Headers */}
            <div className="flex border-b border-white/[0.06]">
              {([
                { key: "chat", label: "Chat", icon: MessageSquare },
                { key: "participants", label: "Participants", icon: Users },
                { key: "questions", label: "Questions", icon: HelpCircle },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                    activeTab === key
                      ? "text-brand border-b-2 border-brand"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {key === "questions" && questions.filter((q) => !q.answered).length > 0 && (
                    <span className="ml-0.5 h-4 min-w-[16px] px-1 rounded-full bg-brand/20 text-brand text-[10px] font-bold flex items-center justify-center">
                      {questions.filter((q) => !q.answered).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ============ Chat Tab ============ */}
            {activeTab === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-brand">{msg.user}</span>
                        <span className="text-xs text-text-muted">{msg.time}</span>
                      </div>
                      <p className="text-sm text-text-secondary">{msg.text}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={sendMessage} className="p-3 border-t border-white/[0.06]">
                  <div className="flex gap-2">
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-surface-2 rounded-lg px-3 py-2 text-sm border border-white/[0.06] focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <Button type="submit" size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            )}

            {/* ============ Participants Tab ============ */}
            {activeTab === "participants" && (
              <>
                <div className="px-3 py-2 border-b border-white/[0.06]">
                  <span className="text-xs text-text-muted">{participants.length} participant{participants.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.03]">
                      <Avatar name={p.name} src={p.image} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-text-muted">{p.role}</p>
                      </div>
                      {p.role === "Instructor" && (
                        <Badge variant="purple" size="sm">Host</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ============ Questions Tab ============ */}
            {activeTab === "questions" && (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {sortedQuestions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-text-muted">
                      <HelpCircle className="h-8 w-8 mb-2 opacity-40" />
                      <p className="text-sm">No questions yet</p>
                      <p className="text-xs mt-1">Be the first to ask!</p>
                    </div>
                  )}

                  {sortedQuestions.map((q) => {
                    const hasVoted = q.votedBy.includes(session?.user?.id || "");
                    return (
                      <div
                        key={q.id}
                        className={`rounded-xl p-3 transition-colors ${
                          q.answered
                            ? "bg-brand/5 border border-brand/10"
                            : "bg-white/[0.03] border border-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {/* Vote column */}
                          <button
                            onClick={() => upvoteQuestion(q.id)}
                            className={`flex flex-col items-center gap-0.5 pt-0.5 min-w-[32px] rounded-lg transition-colors ${
                              hasVoted
                                ? "text-brand"
                                : "text-text-muted hover:text-text-secondary"
                            }`}
                          >
                            <ThumbsUp className={`h-4 w-4 ${hasVoted ? "fill-brand/30" : ""}`} />
                            <span className="text-xs font-semibold">{q.votes}</span>
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${q.answered ? "text-text-tertiary" : "text-text-primary"}`}>
                              {q.text}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[11px] text-text-muted">{q.authorName}</span>
                              {q.answered && (
                                <Badge variant="success" size="sm">
                                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                  Answered
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Mark answered button - only for instructor/admin */}
                          {canManage && (
                            <button
                              onClick={() => markAnswered(q.id)}
                              title={q.answered ? "Mark as unanswered" : "Mark as answered"}
                              className={`p-1.5 rounded-lg transition-colors ${
                                q.answered
                                  ? "text-brand hover:bg-brand/10"
                                  : "text-text-muted hover:text-brand hover:bg-white/[0.03]"
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={submitQuestion} className="p-3 border-t border-white/[0.06]">
                  <div className="flex gap-2">
                    <input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Ask a question..."
                      className="flex-1 bg-surface-2 rounded-lg px-3 py-2 text-sm border border-white/[0.06] focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <Button type="submit" size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
