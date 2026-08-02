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
    const { name, email, password, role } = body;

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

    const user = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        hashedPassword,
        isActive: true,
        role: role === "INSTRUCTOR" ? "INSTRUCTOR" : "STUDENT",
      },
    });

    // Create welcome notification
    await db.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to EduFlow!",
        message: "Your account has been created successfully. Start exploring courses!",
        type: "SUCCESS",
        link: "/courses",
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
