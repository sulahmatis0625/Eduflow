"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

interface StartLiveButtonProps {
  courseId: string;
  courseTitle: string;
}

export function StartLiveButton({ courseId, courseTitle }: StartLiveButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartLive = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/classrooms/${courseId}/live`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `${courseTitle} - Live Session` }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to start live session.");
        setLoading(false);
        return;
      }

      const session = await res.json();
      router.push(`/live/${session.id}`);
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleStartLive} isLoading={loading} disabled={loading}>
      <Video className="h-4 w-4 mr-2" />
      Start Live Class
    </Button>
  );
}
