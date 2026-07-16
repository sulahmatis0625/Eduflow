"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, Trophy, Award, Settings,
  GraduationCap, MessageSquare, Bell, BarChart3, Calendar,
  Users, Plus, UserPlus,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const role = session?.user?.role;
  const isTeacher = role === "INSTRUCTOR" || role === "ADMIN";

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount);
        }
      })
      .catch(() => {});
  }, [session?.user, pathname]);

  const links: { href: string; icon: typeof LayoutDashboard; label: string; badge?: number }[] = isTeacher
    ? [
        { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
        { href: "/dashboard/classrooms/new", icon: Plus, label: "Create Classroom" },
        { href: "/dashboard/courses", icon: GraduationCap, label: "My Classrooms" },
        { href: "/dashboard/notifications", icon: Bell, label: "Notifications", badge: unreadCount },
        { href: "/dashboard/settings", icon: Settings, label: "Settings" },
      ]
    : [
        { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
        { href: "/dashboard/classrooms/join", icon: UserPlus, label: "Join Classroom" },
        { href: "/dashboard/courses", icon: BookOpen, label: "My Courses" },
        { href: "/dashboard/notifications", icon: Bell, label: "Notifications", badge: unreadCount },
        { href: "/dashboard/certificates", icon: Award, label: "Certificates" },
        { href: "/dashboard/achievements", icon: Trophy, label: "Achievements" },
        { href: "/leaderboard", icon: BarChart3, label: "Leaderboard" },
        { href: "/dashboard/settings", icon: Settings, label: "Settings" },
      ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed top-16 left-0 bottom-0 z-40 w-64 bg-surface-1 border-r border-white/[0.06] transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="text-sm font-medium text-text-secondary">Menu</span>
          <button onClick={onClose} className="p-1 rounded-lg text-text-tertiary hover:text-brand hover:bg-white/[0.03] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand/10 text-brand border-l-2 border-brand rounded-r-lg"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-white/[0.03] rounded-lg"
                )}
              >
                <link.icon className="h-5 w-5" />
                <span className="flex-1">{link.label}</span>
                {link.badge != null && link.badge > 0 && (
                  <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-brand text-[10px] font-bold text-surface-0">
                    {link.badge > 99 ? "99+" : link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* XP Progress */}
        {!isTeacher && (
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-surface-2 rounded-xl p-4 border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gold/10 p-1.5 rounded-lg border border-gold/20">
                <Trophy className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Your Level</p>
                <p className="text-sm font-bold text-text-primary">Level 1</p>
              </div>
            </div>
            <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gold to-amber-400 rounded-full shadow-[0_0_8px_rgba(255,184,0,0.4)]" style={{ width: "0%" }} />
            </div>
            <p className="text-xs text-text-muted mt-2">0 / 100 XP</p>
          </div>
        </div>
        )}
      </aside>
    </>
  );
}
