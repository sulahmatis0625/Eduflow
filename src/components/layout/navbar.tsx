"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import {
  GraduationCap, Menu, X, Search, Bell, BookOpen,
  LayoutDashboard, Trophy, LogOut, Settings, Shield,
  ChevronDown,
} from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-0/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative bg-brand/10 p-2 rounded-xl border border-brand/20 group-hover:shadow-[0_0_20px_rgba(0,255,204,0.3)] transition-shadow">
              <GraduationCap className="h-5 w-5 text-brand" />
              <div className="absolute inset-0 rounded-xl bg-brand/5 blur-sm" />
            </div>
            <span className="font-mono font-bold text-brand text-lg tracking-tight">
              EduFlow
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/courses" className="text-sm text-text-secondary hover:text-white transition-colors duration-200">
              Courses
            </Link>
            <Link href="/leaderboard" className="text-sm text-text-secondary hover:text-white transition-colors duration-200">
              Leaderboard
            </Link>
            {session && (
              <Link href="/dashboard" className="text-sm text-text-secondary hover:text-white transition-colors duration-200">
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <Link href="/courses" className="hidden md:flex p-2 text-text-tertiary hover:text-brand rounded-lg hover:bg-white/[0.03] transition-colors">
                  <Search className="h-5 w-5" />
                </Link>
                <Link href="/dashboard" className="hidden md:flex relative p-2 text-text-tertiary hover:text-brand rounded-lg hover:bg-white/[0.03] transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-brand rounded-full shadow-[0_0_6px_rgba(0,255,204,0.6)]" />
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/[0.03] transition-colors"
                  >
                    <Avatar src={session.user.image} name={session.user.name} size="sm" />
                    <ChevronDown className="h-4 w-4 text-text-tertiary hidden md:block" />
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-surface-2 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/[0.08] py-1 z-50">
                        <div className="px-4 py-3 border-b border-white/[0.08]">
                          <p className="text-sm font-medium text-text-primary">{session.user.name}</p>
                          <p className="text-xs text-text-muted truncate">{session.user.email}</p>
                        </div>
                        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-brand hover:bg-white/[0.03] transition-colors" onClick={() => setProfileOpen(false)}>
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </Link>
                        <Link href="/dashboard/courses" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-brand hover:bg-white/[0.03] transition-colors" onClick={() => setProfileOpen(false)}>
                          <BookOpen className="h-4 w-4" /> My Courses
                        </Link>
                        <Link href="/dashboard/achievements" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-brand hover:bg-white/[0.03] transition-colors" onClick={() => setProfileOpen(false)}>
                          <Trophy className="h-4 w-4" /> Achievements
                        </Link>
                        <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-brand hover:bg-white/[0.03] transition-colors" onClick={() => setProfileOpen(false)}>
                          <Settings className="h-4 w-4" /> Settings
                        </Link>
                        {session.user.role === "ADMIN" && (
                          <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-400 hover:text-purple-300 hover:bg-white/[0.03] transition-colors" onClick={() => setProfileOpen(false)}>
                            <Shield className="h-4 w-4" /> Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-white/[0.08] mt-1 pt-1">
                          <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.03] transition-colors"
                          >
                            <LogOut className="h-4 w-4" /> Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors px-4 py-2">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-brand text-surface-0 text-sm font-medium rounded-full px-5 py-2 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-text-tertiary hover:text-brand hover:bg-white/[0.03] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-white/[0.06] bg-surface-1">
            <nav className="flex flex-col gap-1">
              <Link href="/courses" className="px-3 py-2.5 text-sm text-text-tertiary hover:text-text-primary hover:bg-white/[0.03] rounded-lg transition-colors" onClick={() => setMobileOpen(false)}>
                Courses
              </Link>
              <Link href="/leaderboard" className="px-3 py-2.5 text-sm text-text-tertiary hover:text-text-primary hover:bg-white/[0.03] rounded-lg transition-colors" onClick={() => setMobileOpen(false)}>
                Leaderboard
              </Link>
              {session && (
                <Link href="/dashboard" className="px-3 py-2.5 text-sm text-text-tertiary hover:text-text-primary hover:bg-white/[0.03] rounded-lg transition-colors" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
