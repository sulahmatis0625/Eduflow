import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [activeStudents, publishedCourses, instructors, satisfaction] = await Promise.all([
      db.user.count({ where: { role: "STUDENT", isActive: true } }).catch(() => 0),
      db.course.count({ where: { status: "PUBLISHED" } }).catch(() => 0),
      db.user.count({ where: { role: "INSTRUCTOR" } }).catch(() => 0),
      Promise.resolve(95),
    ]);

    return NextResponse.json({
      activeStudents,
      courses: publishedCourses,
      instructors,
      satisfaction,
    });
  } catch (error) {
    console.error("Platform stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, trial } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    const existing = await db.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userRole = role === "INSTRUCTOR" ? "INSTRUCTOR" : "STUDENT";

    const user = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        hashedPassword,
        isActive: true,
        role: userRole,
      },
    });

    // Create welcome notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to EduFlow!",
        message: trial
          ? "Your free trial course has been added to My Courses. Start learning!"
          : "Your account has been created successfully. Start exploring courses!",
        type: "SUCCESS",
        link: trial ? "/dashboard/courses" : "/courses",
      },
    });

    // Free-trial / student signup → auto-enroll in published free courses
    if (userRole === "STUDENT" && trial) {
      const { enrollUserInFreeCourses } = await import("@/lib/free-trial");
      await enrollUserInFreeCourses(user.id);
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      trial: !!trial,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
