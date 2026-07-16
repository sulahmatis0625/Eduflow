import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  CreditCard,
  Trophy,
} from "lucide-react";
import { NotificationActions } from "./notification-actions";

export const metadata = {
  title: "Notifications | EduFlow",
};

const typeConfig: Record<
  string,
  {
    icon: typeof Info;
    color: string;
    bgColor: string;
    badgeVariant: "default" | "success" | "warning" | "danger" | "info" | "purple";
  }
> = {
  INFO: {
    icon: Info,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    badgeVariant: "info",
  },
  SUCCESS: {
    icon: CheckCircle,
    color: "text-brand",
    bgColor: "bg-brand/10",
    badgeVariant: "success",
  },
  WARNING: {
    icon: AlertTriangle,
    color: "text-gold",
    bgColor: "bg-gold/10",
    badgeVariant: "warning",
  },
  COURSE: {
    icon: BookOpen,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    badgeVariant: "purple",
  },
  PAYMENT: {
    icon: CreditCard,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    badgeVariant: "success",
  },
  ACHIEVEMENT: {
    icon: Trophy,
    color: "text-gold",
    bgColor: "bg-gold/10",
    badgeVariant: "warning",
  },
};

function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupNotifications(
  notifications: {
    id: string;
    title: string;
    message: string;
    type: string;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
  }[]
) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const groups: {
    label: string;
    items: typeof notifications;
  }[] = [
    { label: "Today", items: [] },
    { label: "This Week", items: [] },
    { label: "Earlier", items: [] },
  ];

  for (const n of notifications) {
    const createdAt = new Date(n.createdAt);
    if (createdAt >= todayStart) {
      groups[0].items.push(n);
    } else if (createdAt >= weekStart) {
      groups[1].items.push(n);
    } else {
      groups[2].items.push(n);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;

  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const groups = groupNotifications(notifications);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
          <p className="text-sm text-text-secondary">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>

        {unreadCount > 0 && <NotificationActions type="markAllRead" />}
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title="No notifications"
          description="You'll see notifications here when there are updates about your courses, achievements, and more."
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.label} className="space-y-3">
              <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-1">
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.items.map((notification) => {
                  const config = typeConfig[notification.type] || typeConfig.INFO;
                  const Icon = config.icon;

                  return (
                    <NotificationActions
                      key={notification.id}
                      type="item"
                      notificationId={notification.id}
                      isRead={notification.isRead}
                      link={notification.link}
                    >
                      <Card
                        className={
                          !notification.isRead
                            ? "bg-brand/[0.05] border-brand/20"
                            : undefined
                        }
                      >
                        <CardContent className="py-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`flex-shrink-0 h-9 w-9 rounded-lg ${config.bgColor} flex items-center justify-center mt-0.5`}
                            >
                              <Icon className={`h-4 w-4 ${config.color}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p
                                    className={`text-sm font-medium ${
                                      !notification.isRead
                                        ? "text-text-primary"
                                        : "text-text-secondary"
                                    } truncate`}
                                  >
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">
                                    {notification.message}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-xs text-text-muted whitespace-nowrap">
                                    {getRelativeTime(notification.createdAt)}
                                  </span>
                                  {!notification.isRead && (
                                    <span className="h-2 w-2 rounded-full bg-brand flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </NotificationActions>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
