"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { NavbarSearch } from "@/components/layout/navbar-search";
import { NavbarNotifications } from "@/components/layout/navbar-notifications";
import { cn } from "@/lib/utils";
import {
  GraduationCap, Menu, X, BookOpen,
  LayoutDashboard, Trophy, LogOut, Settings, Shield,
  ChevronDown, ArrowLeft, ArrowRight,
} from "lucide-react";

function navLinkClass(active: boolean, mobile = false) {
  if (mobile) {
    return cn(
      "px-3 py-2.5 text-sm rounded-lg transition-colors",
      active
        ? "text-brand bg-brand/10 font-medium"
        : "text-text-tertiary hover:text-text-primary hover:bg-white/[0.03]"
    );
  }
  return cn(
    "text-sm transition-colors duration-200",
    active
      ? "text-brand font-medium"
      : "text-text-secondary hover:text-white"
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const historyStackRef = useRef<string[]>([]);
  const historyIndexRef = useRef(0);
  const navActionRef = useRef<"back" | "forward" | "pop" | null>(null);
  const historyReadyRef = useRef(false);

  const myCoursesActive =
    pathname === "/dashboard/courses" ||
    pathname.startsWith("/dashboard/courses/");
  const dashboardActive =
    pathname === "/dashboard" ||
    (pathname.startsWith("/dashboard/") &&
      !pathname.startsWith("/dashboard/courses"));

  const NAV_STACK_KEY = "eduflow:nav-stack";

  const persistNavStack = (stack: string[], index: number) => {
    try {
      sessionStorage.setItem(
        NAV_STACK_KEY,
        JSON.stringify({ stack, index })
      );
    } catch {
      /* ignore quota / private mode */
    }
  };

  const syncNavButtons = () => {
    setCanGoBack(historyIndexRef.current > 0);
    setCanGoForward(
      historyIndexRef.current < historyStackRef.current.length - 1
    );
  };

  // Restore stack across refresh so reload stays on this page's history context
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(NAV_STACK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { stack?: string[]; index?: number };
        if (Array.isArray(parsed.stack) && parsed.stack.length > 0) {
          let index =
            typeof parsed.index === "number" ? parsed.index : parsed.stack.length - 1;
          if (parsed.stack[index] !== pathname) {
            const found = parsed.stack.lastIndexOf(pathname);
            index = found >= 0 ? found : parsed.stack.length - 1;
            if (found < 0) {
              parsed.stack = [...parsed.stack.slice(0, index + 1), pathname];
              index = parsed.stack.length - 1;
            }
          }
          historyStackRef.current = parsed.stack;
          historyIndexRef.current = index;
          persistNavStack(parsed.stack, index);
          syncNavButtons();
          historyReadyRef.current = true;
          return;
        }
      }
    } catch {
      /* start fresh */
    }
    historyStackRef.current = [pathname];
    historyIndexRef.current = 0;
    persistNavStack(historyStackRef.current, 0);
    syncNavButtons();
    historyReadyRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep stack in sync with in-app navigations (not back/forward/pop)
  useEffect(() => {
    if (!historyReadyRef.current) return;

    const action = navActionRef.current;
    if (action === "back" || action === "forward" || action === "pop") {
      if (action === "pop") {
        const found = historyStackRef.current.lastIndexOf(pathname);
        if (found >= 0) historyIndexRef.current = found;
      }
      navActionRef.current = null;
      persistNavStack(historyStackRef.current, historyIndexRef.current);
      syncNavButtons();
      return;
    }

    const stack = historyStackRef.current;
    const idx = historyIndexRef.current;
    if (idx >= 0 && stack[idx] === pathname) {
      syncNavButtons();
      return;
    }

    const nextStack = stack.slice(0, idx + 1);
    nextStack.push(pathname);
    historyStackRef.current = nextStack;
    historyIndexRef.current = nextStack.length - 1;
    persistNavStack(nextStack, historyIndexRef.current);
    syncNavButtons();
  }, [pathname]);

  // Browser back/forward must update our index (do not push a new entry)
  useEffect(() => {
    const onPopState = () => {
      navActionRef.current = "pop";
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const goBack = () => {
    if (historyIndexRef.current <= 0) return;
    navActionRef.current = "back";
    historyIndexRef.current -= 1;
    persistNavStack(historyStackRef.current, historyIndexRef.current);
    syncNavButtons();
    // Real browser history — avoids stacking duplicate routes on refresh/back
    window.history.back();
  };

  const goForward = () => {
    if (historyIndexRef.current >= historyStackRef.current.length - 1) return;
    navActionRef.current = "forward";
    historyIndexRef.current += 1;
    persistNavStack(historyStackRef.current, historyIndexRef.current);
    syncNavButtons();
    window.history.forward();
  };

  // Close profile menu on outside click / Escape / route change
  useEffect(() => {
    if (!profileOpen) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const el = profileRef.current;
      if (el && !el.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  useEffect(() => {
    setProfileOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-0/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo — guests → landing; signed-in → Overview */}
          <Link
            href={session ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 group"
          >
            <div className="relative bg-brand/10 p-2 rounded-xl border border-brand/20 group-hover:shadow-[0_0_20px_rgba(0,255,204,0.3)] transition-shadow">
              <GraduationCap className="h-5 w-5 text-brand" />
              <div className="absolute inset-0 rounded-xl bg-brand/5 blur-sm" />
            </div>
            <span className="font-mono font-bold text-brand text-lg tracking-tight">
              EduFlow
            </span>
          </Link>

          {/* Desktop Nav — My Courses only when signed in (not on guest landing) */}
          {session && (
            <nav className="hidden md:flex items-center gap-4">
              <Link
                href="/dashboard/courses"
                className={navLinkClass(myCoursesActive)}
                aria-current={myCoursesActive ? "page" : undefined}
              >
                My Courses
              </Link>
              <Link
                    href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"}
                    className={navLinkClass(dashboardActive || (session.user.role === "ADMIN" && pathname.startsWith("/admin")))}
                    aria-current={dashboardActive ? "page" : undefined}
                  >
                    Dashboard
                  </Link>
            </nav>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
              <button
                type="button"
                onClick={goBack}
                disabled={!canGoBack}
                aria-label="Go back"
                className="group rounded-full p-2 text-text-secondary transition-all duration-300 hover:text-white hover:bg-brand/10 hover:shadow-[0_0_12px_rgba(0,255,204,0.15)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={goForward}
                disabled={!canGoForward}
                aria-label="Go forward"
                className="group rounded-full p-2 text-text-secondary transition-all duration-300 hover:text-white hover:bg-brand/10 hover:shadow-[0_0_12px_rgba(0,255,204,0.15)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </div>

            {session ? (
              <>
                <NavbarSearch />
                <NavbarNotifications />

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/[0.03] transition-colors"
                  >
                    <Avatar
                      src={session.user.image}
                      name={session.user.name}
                      size="sm"
                      key={session.user.image || "no-avatar"}
                    />
                    <ChevronDown className="h-4 w-4 text-text-tertiary hidden md:block" />
                  </button>

                  {profileOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-56 bg-surface-2 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/[0.08] py-1 z-50"
                    >
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
                          type="button"
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.03] transition-colors"
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </div>
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
              <form
                action="/courses"
                method="GET"
                className="px-1 pb-2"
                onSubmit={() => setMobileOpen(false)}
              >
                <input
                  type="search"
                  name="search"
                  placeholder="Search courses..."
                  className="w-full h-10 px-3 rounded-lg bg-surface-2 text-sm text-text-primary placeholder:text-text-muted border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </form>
              {session ? (
                <>
                  <Link
                    href="/dashboard/courses"
                    className={navLinkClass(myCoursesActive, true)}
                    aria-current={myCoursesActive ? "page" : undefined}
                    onClick={() => setMobileOpen(false)}
                  >
                    My Courses
                  </Link>
                  <Link href="/dashboard" className={navLinkClass(dashboardActive, true)} aria-current={dashboardActive ? "page" : undefined} onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                  <Link href="/dashboard/notifications" className={navLinkClass(pathname.startsWith("/dashboard/notifications"), true)} onClick={() => setMobileOpen(false)}>
                    Notifications
                  </Link>
                </>
              ) : null}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
