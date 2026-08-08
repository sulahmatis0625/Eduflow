"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export function NavbarSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    setOpen(false);
    if (q) {
      router.push(`/courses?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/courses");
    }
  }

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Search courses"
        className="flex p-2 text-text-tertiary hover:text-brand rounded-lg hover:bg-white/[0.03] transition-colors"
      >
        <Search className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <form
            onSubmit={submit}
            className="absolute right-0 top-full mt-2 z-50 w-[min(90vw,360px)] rounded-xl border border-white/[0.08] bg-surface-2 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full h-10 pl-9 pr-9 rounded-lg bg-surface-1 text-sm text-text-primary placeholder:text-text-muted border border-white/[0.06] focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
