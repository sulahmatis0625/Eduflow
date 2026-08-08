"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";

export function NavbarNotifications() {
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!session?.user) return;

    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUnread(data.unreadCount ?? 0);
      } catch {
        // ignore
      }
    }

    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [session?.user]);

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
      className="hidden md:flex relative p-2 text-text-tertiary hover:text-brand rounded-lg hover:bg-white/[0.03] transition-colors"
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-brand rounded-full shadow-[0_0_6px_rgba(0,255,204,0.6)]" />
      )}
    </Link>
  );
}
