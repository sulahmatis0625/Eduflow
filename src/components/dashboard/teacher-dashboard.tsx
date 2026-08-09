import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { BookOpen, Users, GraduationCap, Plus, ArrowRight } from "lucide-react";

interface TeacherDashboardProps {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export async function TeacherDashboard({ user }: TeacherDashboardProps) {
  const classrooms = await db.course.findMany({
    where: { instructorId: user.id },
    select: {
      status: true,
      _count: { select: { enrollments: true } },
    },
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
      label: "Courses",
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={user.image} name={user.name} size="xl" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Welcome, {user.name?.split(" ")[0] || "Teacher"}!
            </h1>
            <p className="text-text-secondary">
              Create courses from YouTube videos and manage your students
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/courses">
            <Button variant="outline" size="sm">
              My Courses
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="/dashboard/classrooms/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Classroom
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="min-h-[160px]">
            <CardContent className="flex h-full min-h-[160px] flex-col justify-between gap-6 py-8">
              <div className={`w-fit p-4 rounded-2xl ${stat.color}`}>
                <stat.icon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-text-muted">{stat.label}</p>
                <p className="text-4xl font-bold text-text-primary tracking-tight mt-1">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalClassrooms === 0 && (
        <Card>
          <CardContent className="text-center py-10">
            <GraduationCap className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              No courses yet
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Create a course from a playlist or individual videos, then manage
              it from My Courses.
            </p>
            <Link href="/dashboard/classrooms/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Classroom
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
