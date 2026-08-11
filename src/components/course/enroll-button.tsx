"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { GraduationCap, PlayCircle, CheckCircle, Loader2 } from "lucide-react";

interface EnrollButtonProps {
  courseId: string;
  courseSlug: string;
  isFree: boolean;
  isEnrolled: boolean;
  enrollmentStatus?: string | null;
  /** First lesson id — used to open the learn player correctly */
  firstLessonId?: string | null;
  price?: number;
  formattedPrice?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EnrollButton({
  courseId,
  isFree,
  isEnrolled,
  enrollmentStatus,
  firstLessonId,
  formattedPrice,
  className,
  size = "lg",
}: EnrollButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToLearn = () => {
    if (firstLessonId) {
      router.push(`/learn/${courseId}/${firstLessonId}`);
    } else {
      router.push(`/learn/${courseId}`);
    }
  };

  if (enrollmentStatus === "COMPLETED") {
    return (
      <div className={className}>
        <Button variant="success" size={size} className="w-full" onClick={goToLearn}>
          <CheckCircle className="mr-2 h-5 w-5" />
          Review Course
        </Button>
      </div>
    );
  }

  if (isEnrolled && (enrollmentStatus === "ACTIVE" || enrollmentStatus === "APPROVED")) {
    return (
      <Button
        variant="success"
        size={size}
        className={className}
        onClick={goToLearn}
      >
        <PlayCircle className="mr-2 h-5 w-5" />
        Continue Learning
      </Button>
    );
  }

  if (enrollmentStatus === "PENDING") {
    return (
      <Button variant="secondary" size={size} className={className} disabled>
        <Loader2 className="mr-2 h-5 w-5" />
        Enrollment Pending
      </Button>
    );
  }

  const handleEnroll = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          toast("info", "You're already enrolled in this course");
          router.refresh();
          return;
        }
        throw new Error(data.error || "Failed to enroll");
      }

      toast("success", "Enrolled successfully!");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast("error", message);
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        size={size}
        onClick={handleEnroll}
        isLoading={isLoading}
        className="w-full"
      >
        <GraduationCap className="mr-2 h-5 w-5" />
        {isFree ? "Enroll Free" : `Buy Now${formattedPrice ? ` - ${formattedPrice}` : ""}`}
      </Button>
      {error && (
        <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
