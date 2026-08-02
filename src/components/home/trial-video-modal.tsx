'use client';

import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";

const YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/qz0aGYrrlhU";

export function TrialVideoModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-white/10 text-white text-sm rounded-full hover:border-white/20 transition-all duration-300"
      >
        <PlayCircle className="h-4 w-4" />
        Start Free Trial
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="See EduFlow in action" size="xl">
        <div className="space-y-4">
          <div className="aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
            <iframe
              src={YOUTUBE_EMBED_URL}
              title="EduFlow free trial video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
              className="h-full w-full"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Watch a quick walkthrough of the platform before getting started.
            </p>
            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gold text-surface-0 font-semibold text-sm rounded-full hover:scale-[1.02] transition-all duration-300"
            >
              Continue to sign up
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}
