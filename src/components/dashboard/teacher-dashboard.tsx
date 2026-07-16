import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  BookOpen,
  Users,
  GraduationCap,
  Plus,
  ArrowRight,
  PencilLine,
} from "lucide-react";

interface TeacherDashboardProps {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

const statusBadgeVariant = (
  status: string
): "success" | "warning" | "danger" | "info" | "default" | "purple" => {
  const map: Record<
    string,
    "success" | "warning" | "danger" | "info" | "default" | "purple"
  > = {
    PUBLISHED: "success",
    PENDING: "warning",
    DRAFT: "default",
    ARCHIVED: "danger",
  };
  return map[status] || "default";
};

export async function TeacherDashboard({ user }: TeacherDashboardProps) {
  const classrooms = await db.course.findMany({
    where: { instructorId: user.id },
    include: {
      _count: { select: { enrollments: true, sections: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalClassrooms = classrooms.length;
  const totalStudents = classrooms.reduce(
    (sum, c) => sum + c._count.enrollments,
    0
  );
  const publishedCount = classrooms.filter(
    (c) => c.status === "PUBLISHED"
  ).length;

  const stats = [
    {
      label: "Classrooms",
      value: totalClassrooms,
      icon: GraduationCap,
      color: "bg-brand/10 text-brand",
    },
    {
      label: "Total Students",
      value: totalStudents,
      icon: Users,
      color: "bg-purple-500/10 text-purple-400",
    },
    {
      label: "Published",
      value: publishedCount,
      icon: BookOpen,
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
              Welcome, {user.name?.split(" ")[0] || "Teacher"}!
            </h1>
            <p className="text-text-secondary">
              Manage your classrooms and students
            </p>
          </div>
        </div>
        <Link href="/dashboard/classrooms/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Classroom
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
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

      {/* Classrooms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-brand">Your Classrooms</h2>
          {classrooms.length > 0 && (
            <Link
              href="/dashboard/classrooms/new"
              className="text-sm text-brand hover:text-brand/80 flex items-center gap-1"
            >
              New Classroom <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {classrooms.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-text-muted mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-text-primary mb-1">
                No classrooms yet
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                Create your first classroom to start teaching.
              </p>
              <Link href="/dashboard/classrooms/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Classroom
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classrooms.map((classroom) => (
              <Card key={classroom.id} hover>
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-text-primary truncate">
                          {classroom.title}
                        </h3>
                        <Badge
                          variant={statusBadgeVariant(classroom.status)}
                          size="sm"
                        >
                          {classroom.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-tertiary line-clamp-2 mb-3">
                        {classroom.shortDescription || classroom.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {classroom._count.enrollments} students
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {classroom._count.sections} sections
                        </span>
                        <span>Created {formatDate(classroom.createdAt)}</span>
                      </div>
                    </div>
                    <Link href={`/dashboard/classrooms/${classroom.id}`}>
                      <Button variant="ghost" size="sm">
                        <PencilLine className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
