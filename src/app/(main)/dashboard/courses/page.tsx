import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, getGradeLabel, getGradeColor, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { InstructorCourseCard } from "@/components/dashboard/instructor-course-card";
import {
  BookOpen,
  PlayCircle,
  CheckCircle,
  Clock,
  GraduationCap,
  Plus,
  BarChart3,
} from "lucide-react";

export const metadata = {
  title: "My Courses | EduFlow",
};

// ==================== STUDENT COURSE CARD ====================

function CourseCard({
  enrollment,
}: {
  enrollment: {
    id: string;
    status: string;
    progress: number;
    grade: number | null;
    enrolledAt: Date;
    completedAt: Date | null;
    course: {
      id: string;
      title: string;
      slug: string;
      thumbnail: string | null;
      totalLessons: number;
      duration: number;
    };
  };
}) {
  const isCompleted = enrollment.status === "COMPLETED";
  const statusVariant: Record<string, "default" | "success" | "warning" | "info"> = {
    ACTIVE: "info",
    APPROVED: "info",
    COMPLETED: "success",
    PENDING: "warning",
    SUSPENDED: "default",
  };

  const href = `/learn/${enrollment.course.id}`;

  return (
    <Link href={href} className="block group">
      <Card hover>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-shrink-0 w-full sm:w-40 h-28 rounded-lg overflow-hidden bg-white/[0.03]">
              {enrollment.course.thumbnail ? (
                <img
                  src={enrollment.course.thumbnail}
                  alt={enrollment.course.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-text-tertiary" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-text-primary group-hover:text-brand transition-colors">
                    {enrollment.course.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {enrollment.course.totalLessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Enrolled {formatDate(enrollment.enrolledAt)}
                    </span>
                    {enrollment.completedAt && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5 text-brand" />
                        Completed {formatDate(enrollment.completedAt)}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={statusVariant[enrollment.status] || "default"}>
                  {enrollment.status}
                </Badge>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-muted">Progress</span>
                  <span className="text-xs font-medium text-text-secondary">
                    {Math.round(enrollment.progress)}%
                  </span>
                </div>
                <Progress
                  value={enrollment.progress}
                  size="sm"
                  color={isCompleted ? "brand" : "blue"}
                />
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  {enrollment.grade !== null && (
                    <span
                      className={cn(
                        "text-sm font-bold",
                        getGradeColor(enrollment.grade)
                      )}
                    >
                      Grade: {getGradeLabel(enrollment.grade)} (
                      {Math.round(enrollment.grade)}%)
                    </span>
                  )}
                </div>
                <Button
                  variant={isCompleted ? "outline" : "primary"}
                  size="sm"
                  tabIndex={-1}
                >
                  {isCompleted ? (
                    <>
                      <GraduationCap className="h-4 w-4 mr-1.5" />
                      Review
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-1.5" />
                      Continue
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ==================== INSTRUCTOR VIEW ====================

async function InstructorCoursesView({ userId }: { userId: string }) {
  const courses = await db.course.findMany({
    where: { instructorId: userId },
    include: {
      _count: { select: { enrollments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const allCourses = courses;
  const published = courses.filter((c) => c.status === "PUBLISHED");
  const drafts = courses.filter((c) => c.status === "DRAFT" || c.status === "PENDING");
  const archived = courses.filter((c) => c.status === "ARCHIVED");

  const emptyAction = (
    <Link href="/dashboard/classrooms/new">
      <Button>
        <Plus className="h-4 w-4 mr-1.5" />
        Create Course
      </Button>
    </Link>
  );

  const renderClassroomList = (
    list: typeof courses,
    emptyTitle: string,
    emptyDescription: string
  ) => {
    if (list.length === 0) {
      return (
        <EmptyState
          icon={<BookOpen className="h-16 w-16" />}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      );
    }
    return (
      <div className="space-y-4">
        {list.map((course) => (
          <InstructorCourseCard key={course.id} course={course} />
        ))}
      </div>
    );
  };

  const tabs = [
    {
      id: "all",
      label: `All (${allCourses.length})`,
      icon: <BookOpen className="h-4 w-4" />,
      content: renderClassroomList(
        allCourses,
        "No classrooms yet",
        "Create your first course to get started as an instructor."
      ),
    },
    {
      id: "published",
      label: `Published (${published.length})`,
      icon: <CheckCircle className="h-4 w-4" />,
      content: renderClassroomList(
        published,
        "No published courses",
        "Publish a course to make it available for students."
      ),
    },
    {
      id: "drafts",
      label: `Drafts (${drafts.length})`,
      icon: <Clock className="h-4 w-4" />,
      content: renderClassroomList(
        drafts,
        "No draft courses",
        "Courses you're working on will appear here."
      ),
    },
    {
      id: "archived",
      label: `Archived (${archived.length})`,
      icon: <BarChart3 className="h-4 w-4" />,
      content: renderClassroomList(
        archived,
        "No archived courses",
        "Archived courses will appear here."
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            My Classrooms
          </h1>
          <p className="text-text-secondary mt-1">
            Manage your courses and track student progress
          </p>
        </div>
        <Link href="/dashboard/classrooms/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            New Course
          </Button>
        </Link>
      </div>

      <Tabs tabs={tabs} defaultTab="all" />
    </div>
  );
}

// ==================== STUDENT VIEW ====================

async function StudentCoursesView({ userId }: { userId: string }) {
  const enrollments = await db.enrollment.findMany({
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
  });

  const allCourses = enrollments;
  const inProgress = enrollments.filter(
    (e) => e.status === "ACTIVE" || e.status === "APPROVED"
  );
  const completed = enrollments.filter((e) => e.status === "COMPLETED");

  const emptyAction = (
    <Link href="/courses">
      <Button>Browse Courses</Button>
    </Link>
  );

  const renderCourseList = (
    courses: typeof enrollments,
    emptyTitle: string,
    emptyDescription: string
  ) => {
    if (courses.length === 0) {
      return (
        <EmptyState
          icon={<BookOpen className="h-16 w-16" />}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      );
    }
    return (
      <div className="space-y-4">
        {courses.map((enrollment) => (
          <CourseCard key={enrollment.id} enrollment={enrollment} />
        ))}
      </div>
    );
  };

  const tabs = [
    {
      id: "all",
      label: `All (${allCourses.length})`,
      icon: <BookOpen className="h-4 w-4" />,
      content: renderCourseList(
        allCourses,
        "No courses yet",
        "You haven't enrolled in any courses. Start exploring our catalog!"
      ),
    },
    {
      id: "in-progress",
      label: `In Progress (${inProgress.length})`,
      icon: <PlayCircle className="h-4 w-4" />,
      content: renderCourseList(
        inProgress,
        "No courses in progress",
        "Courses you're currently working on will appear here."
      ),
    },
    {
      id: "completed",
      label: `Completed (${completed.length})`,
      icon: <CheckCircle className="h-4 w-4" />,
      content: renderCourseList(
        completed,
        "No completed courses",
        "Complete a course to see it listed here. Keep going!"
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            My Courses
          </h1>
          <p className="text-text-secondary mt-1">
            Track and manage your enrolled courses
          </p>
        </div>
        <Link href="/courses">
          <Button variant="outline">Browse More</Button>
        </Link>
      </div>

      <Tabs tabs={tabs} defaultTab="all" />
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default async function MyCoursesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;
  const userRole = session.user.role as string;

  if (userRole === "INSTRUCTOR") {
    return <InstructorCoursesView userId={userId} />;
  }

  return <StudentCoursesView userId={userId} />;
}
