import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";
    const price = searchParams.get("price");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const where: Record<string, unknown> = { status: "PUBLISHED" };

    if (category) where.category = { slug: category };
    if (level) where.level = level;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }
    if (price === "free") where.isFree = true;
    if (price === "paid") where.isFree = false;

    const orderBy: Record<string, string> = {};
    switch (sort) {
      case "price-low": orderBy.price = "asc"; break;
      case "price-high": orderBy.price = "desc"; break;
      case "popular": orderBy.createdAt = "desc"; break;
      default: orderBy.createdAt = "desc";
    }

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        include: {
          instructor: { select: { id: true, name: true, image: true } },
          category: true,
          reviews: { select: { rating: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.course.count({ where }),
    ]);

    return NextResponse.json({ courses, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Courses fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, shortDescription, price, level, categoryId, isFree, tags, requirements, whatYouLearn, targetAudience } = body;

    const slug = title.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, "-") + "-" + Date.now().toString(36);

    const course = await db.course.create({
      data: {
        title,
        slug,
        description,
        shortDescription,
        price: isFree ? 0 : parseFloat(price || "0"),
        level: level || "BEGINNER",
        categoryId,
        instructorId: session.user.id,
        isFree: !!isFree,
        tags,
        requirements,
        whatYouLearn,
        targetAudience,
        status: session.user.role === "ADMIN" ? "PUBLISHED" : "PENDING",
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error("Course creation error:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
