import { db } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { Users, BookOpen, DollarSign, GraduationCap } from "lucide-react";
import { AdminRevenueChart } from "./revenue-chart";

type RecentEnrollment = {
  id: string;
  status: string;
  user: { name: string | null; email: string; image: string | null };
  course: { title: string };
};

type RecentPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  user: { name: string | null; email: string; image: string | null };
  course: { title: string };
};

async function getStats() {
  const [
    totalUsers,
    totalCourses,
    activeEnrollments,
    payments,
    recentEnrollments,
    recentPayments,
    monthlyRevenue,
  ] = await Promise.all([
    db.user.count(),
    db.course.count(),
    db.enrollment.count({ where: { status: { in: ["ACTIVE", "APPROVED"] } } }),
    db.payment.findMany({ where: { status: "COMPLETED" } }),
    db.enrollment.findMany({
      take: 5,
      orderBy: { enrolledAt: "desc" },
      include: { user: true, course: true },
    }),
    db.payment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true, course: true },
    }),
    getMonthlyRevenue(),
  ]);

  const totalRevenue = payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);

  return {
    totalUsers,
    totalCourses,
    totalRevenue,
    activeEnrollments,
    recentEnrollments,
    recentPayments,
    monthlyRevenue,
  };
}

async function getMonthlyRevenue() {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    const payments = await db.payment.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: start, lte: end },
      },
    });

    const revenue = payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
    const monthName = start.toLocaleString("en-US", { month: "short" });

    months.push({ month: monthName, revenue });
  }

  return months;
}

const statusBadgeVariant = (status: string) => {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "default" | "purple"> = {
    COMPLETED: "success",
    ACTIVE: "success",
    APPROVED: "info",
    PENDING: "warning",
    FAILED: "danger",
    REFUNDED: "purple",
    SUSPENDED: "danger",
  };
  return map[status] || "default";
};

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "bg-brand/10",
      iconColor: "text-brand",
      href: "/admin/users",
    },
    {
      label: "Total Courses",
      value: stats.totalCourses.toLocaleString(),
      icon: BookOpen,
      color: "bg-brand/10",
      iconColor: "text-brand",
      href: "/admin/courses",
    },
    {
      label: "Total Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: "bg-gold/10",
      iconColor: "text-gold",
      href: "/admin/payments",
    },
    {
      label: "Active Enrollments",
      value: stats.activeEnrollments.toLocaleString(),
      icon: GraduationCap,
      color: "bg-purple-500/20",
      iconColor: "text-purple-400",
      href: "/admin/enrollments",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Admin Dashboard
        </h1>
        <p className="text-text-tertiary mt-1">
          Overview of your platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-6 hover:bg-white/[0.05] transition-colors h-full">
              <div className="flex items-center gap-4">
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-text-muted">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-text-primary">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-text-primary">
            Revenue Overview
          </h2>
        </div>
        <div className="p-6">
          <AdminRevenueChart data={stats.monthlyRevenue} />
        </div>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrollments */}
        <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">
                Recent Enrollments
              </h2>
              <Link
                href="/admin/enrollments"
                className="text-sm text-brand hover:text-brand/80"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs text-text-tertiary px-6 py-3">
                    Student
                  </th>
                  <th className="text-left text-xs text-text-tertiary px-6 py-3">
                    Course
                  </th>
                  <th className="text-left text-xs text-text-tertiary px-6 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentEnrollments.map((enrollment: RecentEnrollment) => (
                  <tr
                    key={enrollment.id}
                    className="border-b border-white/[0.06] last:border-0"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={enrollment.user.image}
                          name={enrollment.user.name}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-text-primary truncate max-w-[120px]">
                          {enrollment.user.name || enrollment.user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-text-secondary truncate max-w-[150px] block">
                        {enrollment.course.title}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={statusBadgeVariant(enrollment.status)}>
                        {enrollment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {stats.recentEnrollments.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-sm text-text-tertiary"
                    >
                      No enrollments yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">
                Recent Payments
              </h2>
              <Link
                href="/admin/payments"
                className="text-sm text-brand hover:text-brand/80"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs text-text-tertiary px-6 py-3">
                    User
                  </th>
                  <th className="text-left text-xs text-text-tertiary px-6 py-3">
                    Amount
                  </th>
                  <th className="text-left text-xs text-text-tertiary px-6 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPayments.map((payment: RecentPayment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-white/[0.06] last:border-0"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={payment.user.image}
                          name={payment.user.name}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-text-primary truncate max-w-[120px]">
                          {payment.user.name || payment.user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm font-semibold text-text-primary">
                        {formatPrice(payment.amount, payment.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={statusBadgeVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {stats.recentPayments.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-sm text-text-tertiary"
                    >
                      No payments yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-text-primary">
            Quick Actions
          </h2>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/courses"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-surface-0 rounded-lg text-sm font-medium hover:bg-brand/80 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Manage Courses
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand/10 text-brand rounded-lg text-sm font-medium hover:bg-brand/20 transition-colors"
            >
              <Users className="h-4 w-4" />
              Manage Users
            </Link>
            <Link
              href="/admin/enrollments"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors"
            >
              <GraduationCap className="h-4 w-4" />
              Review Enrollments
            </Link>
            <Link
              href="/admin/announcements"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold/10 text-gold rounded-lg text-sm font-medium hover:bg-gold/20 transition-colors"
            >
              <DollarSign className="h-4 w-4" />
              Create Announcement
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
