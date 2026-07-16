"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, Users, CreditCard,
  Award, Video, Settings, FileCheck, Megaphone,
  GraduationCap, ArrowLeft, ClipboardList,
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/courses", icon: BookOpen, label: "Courses" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/enrollments", icon: FileCheck, label: "Enrollments" },
    { href: "/admin/payments", icon: CreditCard, label: "Payments" },
    { href: "/admin/quizzes", icon: ClipboardList, label: "Quizzes" },
    { href: "/admin/live-sessions", icon: Video, label: "Live Sessions" },
    { href: "/admin/certificates", icon: Award, label: "Certificates" },
    { href: "/admin/announcements", icon: Megaphone, label: "Announcements" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className="fixed top-0 left-0 bottom-0 z-40 w-64 bg-surface-0 border-r border-white/[0.06]">
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/[0.06]">
        <div className="relative bg-gradient-to-br from-purple-500/20 to-brand/20 p-2 rounded-xl border border-purple-500/20">
          <GraduationCap className="h-5 w-5 text-brand" />
        </div>
        <div>
          <span className="text-lg font-bold text-brand font-mono tracking-tight">EduFlow</span>
          <span className="text-purple-400 font-mono text-[10px] uppercase tracking-wider block -mt-0.5">Admin Panel</span>
        </div>
      </div>

      <nav className="px-3 py-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg",
                isActive
                  ? "bg-purple-500/15 text-purple-400"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-white/[0.03]"
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/[0.06]">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-text-tertiary hover:text-text-secondary hover:bg-white/[0.03] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Platform
        </Link>
      </div>
    </aside>
  );
}
