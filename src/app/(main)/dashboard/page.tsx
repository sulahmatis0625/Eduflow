import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";
import { DashboardNotifications } from "@/components/dashboard/dashboard-notifications";
import {
  getLevelFromXp,
  getXpForNextLevel,
  getXpProgress,
  cn,
} from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  CheckCircle,
  Award,
  Zap,
  ArrowRight,
  PlayCircle,
  Search,
  Clock,
} from "lucide-react";

export const metadata = {
  title: "Dashboard | EduFlow",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;
  const role = session.user.role;

  if (role === "ADMIN") {
    redirect("/admin");
  }

  if (role === "INSTRUCTOR") {
    const teacher = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true },
    });
    if (!teacher) redirect("/login");
    return <TeacherDashboard user={teacher} />;
  }

  const [user, enrollments, certificates, notifications] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true, xp: true, level: true },
    }),
    db.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            totalLessons: true,
            duration: true,
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
    }),
    db.certificate.findMany({
      where: { userId },
    }),
    db.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  if (!user) redirect("/login");

  const totalEnrolled = enrollments.length;
  const completedCourses = enrollments.filter(
    (e) => e.status === "COMPLETED"
  ).length;
  const inProgressCourses = enrollments.filter(
    (e) => e.status === "ACTIVE" || e.status === "APPROVED"
  );
  const recentCourses = inProgressCourses.slice(0, 4);
  const totalCertificates = certificates.length;
  const userXp = user.xp ?? 0;
  const userLevel = getLevelFromXp(userXp);
  const xpIntoLevel = getXpProgress(userXp);
  const xpNeededForNext = 100;
  const xpToNextLevel = getXpForNextLevel(userXp);

  const stats = [
    {
      label: "Enrolled Courses",
      value: totalEnrolled,
      icon: BookOpen,
      color: "bg-brand/10 text-brand",
    },
    {
      label: "Completed",
      value: completedCourses,
      icon: CheckCircle,
      color: "bg-brand/10 text-brand",
    },
    {
      label: "Certificates",
      value: totalCertificates,
      icon: Award,
      color: "bg-purple-500/10 text-purple-400",
    },
    {
      label: "Total XP",
      value: userXp,
      icon: Zap,
      color: "bg-gold/10 text-gold",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={user.image} name={user.name} size="xl" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Welcome back, {user.name?.split(" ")[0] || "Student"}!
            </h1>
            <p className="text-text-secondary">
              Continue your learning journey
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/courses">
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Browse Courses
            </Button>
          </Link>
          {recentCourses.length > 0 && (
            <Link href={`/courses/${recentCourses[0].course.slug}`}>
              <Button size="sm">
                <PlayCircle className="h-4 w-4 mr-2" />
                Continue Learning
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-text-muted">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-text-primary">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Single level progress — 100 XP per level */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-gold" />
              <span className="font-semibold text-text-primary">
                Level {userLevel}
              </span>
              <span className="text-xs text-text-muted">
                · {userXp} XP total · next level at {xpToNextLevel} XP
              </span>
            </div>
            <span className="text-sm text-text-secondary">
              {xpIntoLevel} / {xpNeededForNext} XP to Level {userLevel + 1}
            </span>
          </div>
          <Progress value={xpIntoLevel} max={xpNeededForNext} color="gold" size="md" />
          <p className="text-xs text-text-muted mt-2">
            Earn XP by completing lessons and quizzes. Every 100 XP raises your
            level by 1.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-stretch">
        {/* Recent Courses */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-sm font-medium text-brand">
              Recent Courses
            </h2>
            <Link
              href="/dashboard/courses"
              className="text-sm text-brand hover:text-brand/80 flex items-center gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentCourses.length === 0 ? (
            <Card className="flex-1 flex flex-col min-h-[280px]">
              <CardContent className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <BookOpen className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  No courses yet
                </h3>
                <p className="text-sm text-text-secondary mb-4 max-w-sm">
                  Start your learning journey by enrolling in a course.
                </p>
                <Link href="/courses">
                  <Button>Browse Courses</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 flex-1">
              {recentCourses.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/learn/${enrollment.course.id}`}
                  className="block group"
                >
                  <Card hover>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-white/[0.03]">
                          {enrollment.course.thumbnail ? (
                            <img
                              src={enrollment.course.thumbnail}
                              alt={enrollment.course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-text-tertiary" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-text-primary truncate group-hover:text-brand transition-colors">
                            {enrollment.course.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {enrollment.course.totalLessons} lessons
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.round(enrollment.progress)}% complete
                            </span>
                          </div>
                          <Progress
                            value={enrollment.progress}
                            size="sm"
                            color="brand"
                            className="mt-2"
                          />
                        </div>
                        <Button variant="ghost" size="sm" tabIndex={-1}>
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Panel */}
        <div className="flex flex-col gap-4">
          <DashboardNotifications initial={notifications} />
        </div>
      </div>
    </div>
  );
}
