"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "eduflow-sidebar-collapsed";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-surface-0">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      <div className="lg:hidden fixed top-[4.5rem] left-4 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg bg-surface-2 border border-white/[0.06] hover:bg-white/[0.03] transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5 text-text-secondary" />
        </button>
      </div>

      <main
        className={cn(
          "pt-6 pb-12 transition-all duration-300",
          collapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
