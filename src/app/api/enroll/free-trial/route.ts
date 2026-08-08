import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enrollUserInFreeCourses } from "@/lib/free-trial";

/** Claim free-trial / free starter courses for the signed-in student. */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "INSTRUCTOR" || session.user.role === "ADMIN") {
      return NextResponse.json({
        enrolled: [],
        message: "Free trial courses are for student accounts.",
      });
    }

    const result = await enrollUserInFreeCourses(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Free trial enroll error:", error);
    return NextResponse.json(
      { error: "Failed to enroll in free trial courses" },
      { status: 500 }
    );
  }
}
