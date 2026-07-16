"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

interface MarkAllReadProps {
  type: "markAllRead";
  children?: never;
  notificationId?: never;
  isRead?: never;
  link?: never;
}

interface ItemProps {
  type: "item";
  children: React.ReactNode;
  notificationId: string;
  isRead: boolean;
  link?: string | null;
}

type NotificationActionsProps = MarkAllReadProps | ItemProps;

export function NotificationActions(props: NotificationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      router.refresh();
    } catch {
      console.error("Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  }

  async function markOneRead(notificationId: string, link?: string | null) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      if (link) {
        router.push(link);
      } else {
        router.refresh();
      }
    } catch {
      console.error("Failed to mark as read");
    }
  }

  if (props.type === "markAllRead") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={markAllRead}
        isLoading={loading}
      >
        <CheckCheck className="h-4 w-4 mr-2" />
        Mark all as read
      </Button>
    );
  }

  return (
    <div
      className="cursor-pointer"
      onClick={() => {
        if (!props.isRead) {
          markOneRead(props.notificationId, props.link);
        } else if (props.link) {
          router.push(props.link);
        }
      }}
    >
      {props.children}
    </div>
  );
}
