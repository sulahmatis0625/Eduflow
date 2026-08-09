"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, cn } from "@/lib/utils";
import { Bell } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

const typeColors: Record<string, "default" | "success" | "warning" | "info" | "danger"> = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  COURSE: "info",
  PAYMENT: "default",
  ACHIEVEMENT: "success",
};

export function DashboardNotifications({
  initial,
}: {
  initial: NotificationItem[];
}) {
  const [items, setItems] = useState(initial);

  async function handleClick(n: NotificationItem) {
    // Keep recent notifications — mark read instead of removing
    setItems((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
    );

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: n.id }),
      });
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-medium text-brand">Notifications</h2>
        <Link
          href="/dashboard/notifications"
          className="text-xs text-text-tertiary hover:text-brand transition-colors"
        >
          View all
        </Link>
      </div>

      <Card className="flex-1">
        {items.length === 0 ? (
          <CardContent className="text-center py-8 h-full flex flex-col items-center justify-center">
            <Bell className="h-10 w-10 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No notifications yet</p>
          </CardContent>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {items.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleClick(notification)}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-white/[0.03] transition-colors",
                  !notification.isRead && "bg-brand/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="flex-shrink-0 h-2 w-2 rounded-full bg-brand" />
                      )}
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={typeColors[notification.type] || "default"}
                    size="sm"
                  >
                    {notification.type}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
