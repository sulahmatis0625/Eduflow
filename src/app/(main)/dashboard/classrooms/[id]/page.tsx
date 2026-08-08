import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, cn } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { StartLiveButton } from "./start-live-button";
import { ClassroomAnnouncements } from "@/components/dashboard/classroom-announcements";
import { ClassroomCurriculum } from "@/components/dashboard/classroom-curriculum";
import { ClassroomDiscussions } from "@/components/dashboard/classroom-discussions";
import { ClassroomQuizzes } from "@/components/dashboard/classroom-quizzes";
import { ClassroomGradebook } from "@/components/dashboard/classroom-gradebook";
import {
  ArrowLeft,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  GraduationCap,
  Layers,
  Video,
  TrendingUp,
  CircleDot,
  Megaphone,
  MessageSquare,
  HelpCircle,
  Share2,
} from "lucide-react";
import { CopyJoinCode } from "./copy-join-code";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await db.course.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: course ? `${course.title} | EduFlow` : "Classroom | EduFlow",
  };
}

const statusBadgeVariant = (
  status: string
): "success" | "warning" | "danger" | "info" | "default" | "purple" => {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "default" | "purple"> = {
    PUBLISHED: "success",
    PENDING: "warning",
    DRAFT: "default",
    ARCHIVED: "danger",
    ACTIVE: "success",
    APPROVED: "info",
    COMPLETED: "purple",
    SUSPENDED: "danger",
  };
  return map[status] || "default";
};

const levelBadgeVariant = (
  level: string
): "success" | "warning" | "info" | "default" => {
  const map: Record<string, "success" | "warning" | "info" | "default"> = {
    BEGINNER: "success",
    INTERMEDIATE: "warning",
    ADVANCED: "danger" as "warning",
  };
  return map[level] || "default";
};

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const userId = session.user.id as string;
  const role = session.user.role;

  if (role !== "INSTRUCTOR" && role !== "ADMIN") {
    redirect("/dashboard");
  }

  const course = await db.course.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
      enrollments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      },
      liveSessions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: {
        select: {
          enrollments: true,
          sections: true,
          reviews: true,
        },
      },
    },
  });

  if (!course) notFound();

  // Verify ownership
  if (role !== "ADMIN" && course.instructorId !== userId) {
    redirect("/dashboard");
  }

  // Compute stats
  const totalStudents = course._count.enrollments;
  const activeStudents = course.enrollments.filter(
    (e) => e.status === "ACTIVE" || e.status === "APPROVED"
  ).length;
  const completedStudents = course.enrollments.filter(
    (e) => e.status === "COMPLETED"
  ).length;
  const avgProgress =
    totalStudents > 0
      ? Math.round(
          course.enrollments.reduce((sum, e) => sum + e.progress, 0) / totalStudents
        )
      : 0;
  const completionRate =
    totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;
  const totalLessons = course.sections.reduce(
    (sum, s) => sum + s.lessons.length,
    0
  );
  const totalSections = course.sections.length;
  const activeLiveSession = course.liveSessions.find((s) => s.status === "LIVE");

  const stats = [
    {
      label: "Students",
      value: totalStudents,
      icon: Users,
      color: "bg-brand/10 text-brand",
    },
    {
      label: "Avg Progress",
      value: `${avgProgress}%`,
      icon: TrendingUp,
      color: "bg-purple-500/10 text-purple-400",
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      icon: CheckCircle,
      color: "bg-gold/10 text-gold",
    },
    {
      label: "Lessons",
      value: totalLessons,
      icon: BookOpen,
      color: "bg-blue-500/10 text-blue-400",
    },
  ];

  // --- Students Tab ---
  const studentsTab = (
    <div className="space-y-3">
      {course.enrollments.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No students enrolled"
          description="Students will appear here once they enroll in your classroom."
        />
      ) : (
        <div className="space-y-2">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
            <div className="col-span-5">Student</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Progress</div>
            <div className="col-span-2 text-right">Enrolled</div>
          </div>

          {course.enrollments.map((enrollment) => (
            <Card key={enrollment.id}>
              <CardContent className="py-3">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Student info */}
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <Avatar
                      src={enrollment.user.image}
                      name={enrollment.user.name}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {enrollment.user.name || "Unnamed"}
                      </p>
                      <p className="text-xs text-text-tertiary truncate">
                        {enrollment.user.email}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <Badge variant={statusBadgeVariant(enrollment.status)} size="sm">
                      {enrollment.status}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="col-span-3 flex items-center gap-3">
                    <Progress
                      value={enrollment.progress}
                      size="sm"
                      color="brand"
                      className="flex-1"
                    />
                    <span className="text-xs font-medium text-text-secondary w-10 text-right">
                      {Math.round(enrollment.progress)}%
                    </span>
                  </div>

                  {/* Enrolled date */}
                  <div className="col-span-2 text-right">
                    <span className="text-xs text-text-tertiary">
                      {formatDate(enrollment.enrolledAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // --- Curriculum Tab ---
  const curriculumTab = <ClassroomCurriculum courseId={course.id} />;

  // --- Live Sessions Tab ---
  const liveTab = (
    <div className="space-y-4">
      {activeLiveSession && (
        <Card className="border-brand/30 bg-brand/[0.04]">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <CircleDot className="h-5 w-5 text-red-400" />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-surface-0 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {activeLiveSession.title}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Started {formatDate(activeLiveSession.startTime)}
                  </p>
                </div>
              </div>
              <Link href={`/live/${activeLiveSession.id}`}>
                <Button size="sm" variant="danger">
                  <Video className="h-4 w-4 mr-2" />
                  Rejoin
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {course.liveSessions.length === 0 ? (
        <EmptyState
          icon={<Video className="h-12 w-12" />}
          title="No live sessions yet"
          description="Start a live class to interact with your students in real-time."
          action={
            <StartLiveButton courseId={course.id} courseTitle={course.title} />
          }
        />
      ) : (
        <div className="space-y-2">
          {course.liveSessions
            .filter((s) => s.id !== activeLiveSession?.id)
            .map((liveSession) => {
              const statusColors: Record<string, "success" | "warning" | "danger" | "default" | "info"> = {
                SCHEDULED: "info",
                LIVE: "danger",
                ENDED: "default",
                CANCELLED: "warning",
              };
              return (
                <Card key={liveSession.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-white/[0.06] flex items-center justify-center">
                          <Video className="h-4 w-4 text-text-tertiary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {liveSession.title}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {formatDate(liveSession.startTime)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusColors[liveSession.status] || "default"} size="sm">
                        {liveSession.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">
              {course.title}
            </h1>
            <Badge variant={statusBadgeVariant(course.status)} size="md">
              {course.status}
            </Badge>
          </div>
          <p className="text-text-secondary text-sm max-w-2xl">
            {course.shortDescription || course.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-text-tertiary">
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              {course.level}
            </span>
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {totalSections} sections
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {totalLessons} lessons
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Created {formatDate(course.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {!activeLiveSession && (
            <StartLiveButton courseId={course.id} courseTitle={course.title} />
          )}
        </div>
      </div>

      {/* Share Join Code */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-brand/10">
              <Share2 className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Share Join Code
              </p>
              <p className="text-xs text-text-tertiary">
                Share this code with students to let them join
              </p>
            </div>
          </div>
          <CopyJoinCode code={course.slug} />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-text-muted">{stat.label}</p>
                <p className="text-2xl font-bold text-text-primary">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active students breakdown */}
      {totalStudents > 0 && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-text-primary">
                Student Status Breakdown
              </span>
              <span className="text-xs text-text-tertiary">
                {totalStudents} total
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                <span className="text-text-secondary">
                  Active: <span className="font-medium text-text-primary">{activeStudents}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                <span className="text-text-secondary">
                  Completed: <span className="font-medium text-text-primary">{completedStudents}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="text-text-secondary">
                  Other: <span className="font-medium text-text-primary">{totalStudents - activeStudents - completedStudents}</span>
                </span>
              </div>
            </div>
            <Progress value={avgProgress} size="md" color="brand" className="mt-3" showLabel />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: "students",
            label: `Students (${totalStudents})`,
            icon: <Users className="h-4 w-4" />,
            content: studentsTab,
          },
          {
            id: "curriculum",
            label: `Curriculum (${totalSections})`,
            icon: <Layers className="h-4 w-4" />,
            content: curriculumTab,
          },
          {
            id: "live",
            label: `Live Sessions`,
            icon: <Video className="h-4 w-4" />,
            content: liveTab,
          },
          {
            id: "quizzes",
            label: "Quizzes",
            icon: <HelpCircle className="h-4 w-4" />,
            content: <ClassroomQuizzes courseId={course.id} />,
          },
          {
            id: "discussions",
            label: "Discussions",
            icon: <MessageSquare className="h-4 w-4" />,
            content: <ClassroomDiscussions courseId={course.id} />,
          },
          {
            id: "announcements",
            label: "Announcements",
            icon: <Megaphone className="h-4 w-4" />,
            content: <ClassroomAnnouncements courseId={course.id} />,
          },
          {
            id: "grades",
            label: "Grades",
            icon: <GraduationCap className="h-4 w-4" />,
            content: <ClassroomGradebook courseId={course.id} />,
          },
        ]}
        defaultTab="students"
      />
    </div>
  );
}
