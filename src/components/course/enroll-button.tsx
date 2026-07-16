"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, PlayCircle, CheckCircle, Loader2 } from "lucide-react";

interface EnrollButtonProps {
  courseId: string;
  courseSlug: string;
  isFree: boolean;
  isEnrolled: boolean;
  enrollmentStatus?: string | null;
  price?: number;
  formattedPrice?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EnrollButton({
  courseId,
  courseSlug,
  isFree,
  isEnrolled,
  enrollmentStatus,
  price,
  formattedPrice,
  className,
  size = "lg",
}: EnrollButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already enrolled and completed
  if (enrollmentStatus === "COMPLETED") {
    return (
      <div className={className}>
        <Badge variant="success" size="md">
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          Completed
        </Badge>
      </div>
    );
  }

  // Enrolled and active - show continue learning
  if (isEnrolled && (enrollmentStatus === "ACTIVE" || enrollmentStatus === "APPROVED")) {
    return (
      <Button
        variant="success"
        size={size}
        className={className}
        onClick={() => router.push(`/learn/${courseSlug}`)}
      >
        <PlayCircle className="mr-2 h-5 w-5" />
        Continue Learning
      </Button>
    );
  }

  // Enrollment pending
  if (enrollmentStatus === "PENDING") {
    return (
      <Button variant="secondary" size={size} className={className} disabled>
        <Loader2 className="mr-2 h-5 w-5" />
        Enrollment Pending
      </Button>
    );
  }

  // Not enrolled - show enroll button
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
        if (data.requiresPayment) {
          router.push(`/courses/${courseSlug}/checkout`);
          return;
        }
        if (res.status === 409) {
          // Already enrolled, refresh the page
          router.refresh();
          return;
        }
        throw new Error(data.error || "Failed to enroll");
      }

      // Enrollment successful - redirect to course learning page
      router.push(`/learn/${courseSlug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
