import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice, formatDuration } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/star-rating";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/avatar";
import {
  Search, BookOpen, Clock, Users, SlidersHorizontal,
  GraduationCap, Filter,
} from "lucide-react";
import type { Metadata } from "next";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  createdAt: Date;
  _count: { courses: number };
}

interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  thumbnail: string | null;
  price: number;
  discountPrice: number | null;
  isFree: boolean;
  level: string;
  status: string;
  duration: number;
  totalLessons: number;
  instructor: { name: string | null; image: string | null };
  category: { id: string; name: string; slug: string } | null;
  reviews: { rating: number }[];
  _count: { enrollments: number };
}

export const metadata: Metadata = {
  title: "Browse Courses - EduFlow",
  description: "Explore our catalog of expert-led online courses. Filter by category, level, and price to find the perfect course for you.",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

const LEVEL_OPTIONS = [
  { value: "", label: "All Levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const PRICE_OPTIONS = [
  { value: "", label: "All Prices" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

function getLevelBadgeVariant(level: string) {
  switch (level) {
    case "BEGINNER": return "success" as const;
    case "INTERMEDIATE": return "warning" as const;
    case "ADVANCED": return "danger" as const;
    default: return "default" as const;
  }
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const category = typeof params.category === "string" ? params.category : "";
  const level = typeof params.level === "string" ? params.level : "";
  const price = typeof params.price === "string" ? params.price : "";
  const sort = typeof params.sort === "string" ? params.sort : "newest";

  let categories: CategoryWithCount[] = [];
  let courses: CourseListItem[] = [];
  let dataUnavailable = false;

  try {
    if (process.env.DATABASE_URL || process.env.DIRECT_URL) {
      categories = await db.category.findMany({
        include: { _count: { select: { courses: true } } },
        orderBy: { name: "asc" },
      });
    } else {
      dataUnavailable = true;
    }
  } catch (error) {
    console.error("Failed to load course categories:", error);
    dataUnavailable = true;
  }

  // Build the where clause
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
  };

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { tags: { contains: search } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  if (level) {
    where.level = level;
  }

  if (price === "free") {
    where.isFree = true;
  } else if (price === "paid") {
    where.isFree = false;
  }

  // Build orderBy
  let orderBy: Record<string, string> = { createdAt: "desc" };
  switch (sort) {
    case "popular":
      orderBy = { totalLessons: "desc" };
      break;
    case "price-low":
      orderBy = { price: "asc" };
      break;
    case "price-high":
      orderBy = { price: "desc" };
      break;
    case "rating":
      orderBy = { createdAt: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  try {
    if (!dataUnavailable && (process.env.DATABASE_URL || process.env.DIRECT_URL)) {
      courses = await db.course.findMany({
        where: where as any,
        include: {
          instructor: { select: { name: true, image: true } },
          category: true,
          reviews: { select: { rating: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy,
      });
    }
  } catch (error) {
    console.error("Failed to load courses:", error);
    dataUnavailable = true;
    courses = [];
  }

  // Sort by rating in JS if needed (Prisma doesn't support aggregated sort easily)
  let sortedCourses = courses;
  if (sort === "rating") {
    sortedCourses = [...courses].sort((a, b) => {
      const avgA = a.reviews.length > 0
        ? a.reviews.reduce((s, r) => s + r.rating, 0) / a.reviews.length
        : 0;
      const avgB = b.reviews.length > 0
        ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length
        : 0;
      return avgB - avgA;
    });
  }

  // Build current search params string for filter links
  function buildFilterUrl(key: string, value: string) {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (category) p.set("category", category);
    if (level) p.set("level", level);
    if (price) p.set("price", price);
    if (sort && sort !== "newest") p.set("sort", sort);

    if (value) {
      p.set(key, value);
    } else {
      p.delete(key);
    }

    const qs = p.toString();
    return `/courses${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="bg-surface-0 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-surface-3 via-surface-2 to-surface-0 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">Explore Courses</h1>
          <p className="text-text-secondary text-lg max-w-2xl">
            Discover courses taught by industry experts. Find the perfect course to advance your skills.
          </p>

          {/* Search Bar */}
          <form action="/courses" method="GET" className="mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search courses by title, topic, or keyword..."
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-2 text-text-primary text-sm placeholder:text-text-muted border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand/50"
              />
              {category && <input type="hidden" name="category" value={category} />}
              {level && <input type="hidden" name="level" value={level} />}
              {price && <input type="hidden" name="price" value={price} />}
              {sort && sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {dataUnavailable && (
          <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Course data is temporarily unavailable because the database connection is not configured yet.
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Categories */}
              <Card>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-brand flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4" /> Categories
                  </h3>
                  <div className="space-y-1">
                    <Link
                      href={buildFilterUrl("category", "")}
                      className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                        !category
                          ? "bg-brand/10 text-brand font-medium"
                          : "text-text-secondary hover:bg-white/[0.03]"
                      }`}
                    >
                      All Categories
                    </Link>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={buildFilterUrl("category", cat.slug)}
                        className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                          category === cat.slug
                            ? "bg-brand/10 text-brand font-medium"
                            : "text-text-secondary hover:bg-white/[0.03]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{cat.icon || "📁"}</span>
                          <span>{cat.name}</span>
                        </span>
                        <span className="text-xs text-text-tertiary">{cat._count.courses}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Level Filter */}
              <Card>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-brand flex items-center gap-2 mb-3">
                    <SlidersHorizontal className="h-4 w-4" /> Level
                  </h3>
                  <div className="space-y-1">
                    {LEVEL_OPTIONS.map((opt) => (
                      <Link
                        key={opt.value}
                        href={buildFilterUrl("level", opt.value)}
                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                          level === opt.value
                            ? "bg-brand/10 text-brand font-medium"
                            : "text-text-secondary hover:bg-white/[0.03]"
                        }`}
                      >
                        {opt.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Price Filter */}
              <Card>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-brand flex items-center gap-2 mb-3">
                    <SlidersHorizontal className="h-4 w-4" /> Price
                  </h3>
                  <div className="space-y-1">
                    {PRICE_OPTIONS.map((opt) => (
                      <Link
                        key={opt.value}
                        href={buildFilterUrl("price", opt.value)}
                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                          price === opt.value
                            ? "bg-brand/10 text-brand font-medium"
                            : "text-text-secondary hover:bg-white/[0.03]"
                        }`}
                      >
                        {opt.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <p className="text-sm text-text-secondary">
                Showing <span className="font-semibold text-text-primary">{sortedCourses.length}</span> course{sortedCourses.length !== 1 ? "s" : ""}
                {search && (
                  <span> for &ldquo;<span className="font-medium text-text-secondary">{search}</span>&rdquo;</span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-tertiary whitespace-nowrap">Sort by:</span>
                <div className="flex flex-wrap gap-1">
                  {SORT_OPTIONS.map((opt) => (
                    <Link
                      key={opt.value}
                      href={buildFilterUrl("sort", opt.value === "newest" ? "" : opt.value)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        sort === opt.value || (!sort && opt.value === "newest")
                          ? "bg-brand text-black"
                          : "bg-white/[0.05] text-text-secondary border border-white/[0.06] hover:bg-white/[0.08]"
                      }`}
                    >
                      {opt.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Course Grid */}
            {sortedCourses.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedCourses.map((course) => {
                  const avgRating = course.reviews.length > 0
                    ? course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length
                    : 0;
                  return (
                    <Link key={course.id} href={`/courses/${course.slug}`}>
                      <Card hover className="overflow-hidden h-full flex flex-col">
                        {/* Thumbnail */}
                        <div className="relative h-44 bg-gradient-to-br from-surface-3 to-surface-2 overflow-hidden">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <BookOpen className="h-12 w-12 text-text-muted" />
                            </div>
                          )}
                          {course.isFree && (
                            <span className="absolute top-3 left-3 px-2.5 py-1 bg-brand text-black text-xs font-bold rounded-md">
                              FREE
                            </span>
                          )}
                          {course.discountPrice && !course.isFree && (
                            <span className="absolute top-3 left-3 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-md">
                              SALE
                            </span>
                          )}
                          <Badge
                            variant={getLevelBadgeVariant(course.level)}
                            className="absolute top-3 right-3"
                          >
                            {course.level}
                          </Badge>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-1">
                          {course.category && (
                            <span className="text-xs text-brand mb-1">
                              {course.category.name}
                            </span>
                          )}
                          <h3 className="font-semibold text-text-primary mb-2 line-clamp-2 leading-snug">
                            {course.title}
                          </h3>
                          <p className="text-sm text-text-secondary mb-3 line-clamp-2 flex-1">
                            {course.shortDescription || course.description}
                          </p>

                          {/* Stats */}
                          <div className="flex items-center gap-3 text-xs text-text-tertiary mb-3">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDuration(course.duration)}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5" />
                              {course.totalLessons} lessons
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {course._count.enrollments}
                            </span>
                          </div>

                          {/* Rating */}
                          <div className="mb-3">
                            <StarRating
                              rating={avgRating}
                              size="sm"
                              showValue
                              totalReviews={course.reviews.length}
                            />
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                            <div className="flex items-center gap-2">
                              <Avatar src={course.instructor.image} name={course.instructor.name} size="sm" />
                              <span className="text-sm text-text-secondary truncate max-w-[120px]">
                                {course.instructor.name}
                              </span>
                            </div>
                            <div className="text-right">
                              {course.isFree ? (
                                <span className="text-lg font-bold text-brand">Free</span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  {course.discountPrice && (
                                    <span className="text-sm text-text-tertiary line-through">
                                      {formatPrice(course.price)}
                                    </span>
                                  )}
                                  <span className="text-lg font-bold text-text-primary">
                                    {formatPrice(course.discountPrice ?? course.price)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<GraduationCap className="h-16 w-16" />}
                title="No courses found"
                description={
                  search
                    ? `No courses match "${search}". Try adjusting your search or filters.`
                    : "No courses match your current filters. Try broadening your search."
                }
                action={
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-black text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors"
                  >
                    Clear All Filters
                  </Link>
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
