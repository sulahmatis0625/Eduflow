"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

type Notif = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NavbarNotifications() {
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user) return;

    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setUnread(data.unreadCount ?? 0);
        setItems((data.notifications || []).slice(0, 8));
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

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!session?.user) return null;

  return (
    <div className="relative hidden md:block" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unread > 0 ? `${unread} unread notifications` : "Notifications"
        }
        className="relative p-2 text-text-tertiary hover:text-brand rounded-lg hover:bg-white/[0.03] transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-brand rounded-full shadow-[0_0_6px_rgba(0,255,204,0.6)]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/[0.08] bg-surface-1 shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
            <p className="text-sm font-medium text-text-primary">
              Recent notifications
            </p>
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-brand hover:underline"
            >
              View all
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-sm text-text-muted text-center">
              No notifications yet
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-white/[0.06]">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.link || "/dashboard/notifications"}
                    onClick={async () => {
                      setOpen(false);
                      if (!n.isRead) {
                        setItems((prev) =>
                          prev.map((x) =>
                            x.id === n.id ? { ...x, isRead: true } : x
                          )
                        );
                        setUnread((u) => Math.max(0, u - 1));
                        try {
                          await fetch("/api/notifications", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ notificationId: n.id }),
                          });
                        } catch {
                          /* ignore */
                        }
                      }
                    }}
                    className={cn(
                      "block px-3 py-2.5 hover:bg-white/[0.04] transition-colors",
                      !n.isRead && "bg-brand/5"
                    )}
                  >
                    <p className="text-sm text-text-primary font-medium line-clamp-1">
                      {n.title}
                    </p>
                    <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">
                      {formatDate(n.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
