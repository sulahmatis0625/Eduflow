import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatPrice, formatDuration, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StarRating } from "@/components/ui/star-rating";
import { Progress } from "@/components/ui/progress";
import { Tabs } from "@/components/ui/tabs";
import { EnrollButton } from "@/components/course/enroll-button";
import { CoursePreviewMedia } from "@/components/course/course-preview-media";
import {
  BookOpen, Clock, Users, Award, BarChart3,
  PlayCircle, FileText, CheckCircle, Lock,
  Globe, Calendar, GraduationCap, Star,
  ChevronDown, ChevronRight, Shield, Megaphone,
} from "lucide-react";
import type { Metadata } from "next";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

interface CourseLesson {
  id: string;
  title: string;
  type: string;
  duration: number;
  isFree: boolean;
  isPreview: boolean;
}

interface CourseSection {
  id: string;
  title: string;
  order: number;
  lessons: CourseLesson[];
}

interface CourseReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: { name: string | null; image: string | null };
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await db.course.findUnique({
    where: { slug },
    select: { title: true, shortDescription: true, description: true },
  }).catch(() => null);

  if (!course) {
    return { title: "Course Not Found - EduFlow" };
  }

  return {
    title: `${course.title} - EduFlow`,
    description: course.shortDescription || course.description.slice(0, 160),
  };
}

function getLevelBadgeVariant(level: string) {
  switch (level) {
    case "BEGINNER": return "success" as const;
    case "INTERMEDIATE": return "warning" as const;
    case "ADVANCED": return "danger" as const;
    default: return "default" as const;
  }
}

function getLessonIcon(type: string) {
  switch (type) {
    case "VIDEO": return <PlayCircle className="h-4 w-4" />;
    case "TEXT": return <FileText className="h-4 w-4" />;
    case "QUIZ": return <BarChart3 className="h-4 w-4" />;
    case "ASSIGNMENT": return <FileText className="h-4 w-4" />;
    case "LIVE": return <Globe className="h-4 w-4" />;
    default: return <BookOpen className="h-4 w-4" />;
  }
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { slug } = await params;
  const session = await auth();

  const courseResult = await db.course.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          _count: { select: { courses: true } },
        },
      },
      category: true,
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              type: true,
              duration: true,
              isFree: true,
              isPreview: true,
            },
          },
        },
      },
      reviews: {
        include: {
          user: { select: { name: true, image: true } },
        },
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { enrollments: true },
      },
    },
  });

  if (!courseResult) {
    notFound();
  }

  const course = courseResult;

  // Instructors manage their own courses in the dashboard — not the student catalog page
  if (
    session?.user?.id &&
    course.instructorId === session.user.id &&
    ["INSTRUCTOR", "ADMIN"].includes(session.user.role)
  ) {
    redirect(`/dashboard/classrooms/${course.id}`);
  }

  // Extract typed arrays from the course result
  const sections: CourseSection[] = course.sections;
  const reviews: CourseReview[] = course.reviews;

  // Check if user is enrolled
  let enrollment = null;
  if (session?.user?.id) {
    enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    }).catch(() => null);
  }

  // Fetch recent announcements for this course
  const announcements = await db.announcement.findMany({
    where: { courseId: course.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  // Calculate stats
  const avgRating = reviews.length > 0
    ? reviews.reduce((s: number, r) => s + r.rating, 0) / reviews.length
    : 0;

  const totalLessons = sections.reduce(
    (sum: number, section) => sum + section.lessons.length, 0
  );

  const totalDuration = sections.reduce(
    (sum: number, section) => sum + section.lessons.reduce((s: number, l) => s + l.duration, 0), 0
  );

  // Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
      : 0,
  }));

  const whatYouLearn: string[] = course.whatYouLearn
    ? (course.whatYouLearn as string).split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const requirements: string[] = course.requirements
    ? (course.requirements as string).split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const tags: string[] = course.tags
    ? (course.tags as string).split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const isEnrolled = enrollment && ["ACTIVE", "APPROVED", "COMPLETED"].includes(enrollment.status);
  const effectivePrice = course.isFree ? 0 : (course.discountPrice ?? course.price);
  const firstLessonId =
    sections.find((s) => s.lessons.length > 0)?.lessons[0]?.id ?? null;
  const priceCurrency = course.currency || "ETB";

  // --- Tab content ---

  const overviewContent = (
    <div className="space-y-8">
      {/* Description */}
      <div>
        <h3 className="text-xl font-semibold text-text-primary mb-4">About This Course</h3>
        <div className="prose prose-invert max-w-none text-text-secondary leading-relaxed whitespace-pre-line">
          {course.description}
        </div>
      </div>

      {/* What You'll Learn */}
      {whatYouLearn.length > 0 && (
        <div className="bg-brand/5 rounded-xl p-6 border border-brand/10">
          <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-brand" />
            What You&apos;ll Learn
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {whatYouLearn.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-brand mt-0.5 flex-shrink-0" />
                <span className="text-sm text-text-secondary">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requirements */}
      {requirements.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-text-primary mb-4">Requirements</h3>
          <ul className="space-y-2">
            {requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <ChevronRight className="h-4 w-4 text-text-tertiary mt-0.5 flex-shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-3">Topics</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <Badge key={i} variant="default" size="md">{tag}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const curriculumContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-text-secondary">
          {sections.length} section{sections.length !== 1 ? "s" : ""} &middot; {totalLessons} lesson{totalLessons !== 1 ? "s" : ""} &middot; {formatDuration(totalDuration)} total
        </p>
      </div>
      {sections.map((section, si) => (
        <Card key={section.id}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-text-primary flex items-center gap-2">
                <span className="text-xs bg-white/[0.05] text-text-tertiary px-2 py-0.5 rounded-md font-mono">
                  {String(si + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h4>
              <span className="text-xs text-text-tertiary">
                {section.lessons.length} lesson{section.lessons.length !== 1 ? "s" : ""} &middot; {formatDuration(section.lessons.reduce((s, l) => s + l.duration, 0))}
              </span>
            </div>
            <div className="space-y-1">
              {section.lessons.map((lesson, li) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-text-tertiary">
                      {getLessonIcon(lesson.type)}
                    </span>
                    <span className="text-sm text-text-secondary">
                      {lesson.title}
                    </span>
                    {(lesson.isFree || lesson.isPreview) && (
                      <Badge variant="info" size="sm">Preview</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-tertiary">{formatDuration(lesson.duration)}</span>
                    {!isEnrolled && !lesson.isFree && !lesson.isPreview && (
                      <Lock className="h-3.5 w-3.5 text-text-muted" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
      {sections.length === 0 && (
        <div className="text-center py-12 text-text-tertiary">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Curriculum coming soon.</p>
        </div>
      )}
    </div>
  );

  const reviewsContent = (
    <div className="space-y-8">
      {/* Rating Summary */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-8 p-6 bg-white/[0.03] rounded-xl border border-white/[0.06]">
          <div className="text-center sm:text-left">
            <div className="text-5xl font-bold text-text-primary mb-1">
              {avgRating.toFixed(1)}
            </div>
            <StarRating rating={avgRating} size="md" />
            <p className="text-sm text-text-secondary mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex-1 space-y-2">
            {ratingDistribution.map((dist) => (
              <div key={dist.star} className="flex items-center gap-3">
                <span className="text-sm text-text-secondary w-6 text-right">{dist.star}</span>
                <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all"
                    style={{ width: `${dist.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-text-tertiary w-8">{dist.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review List */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-white/[0.06] pb-6 last:border-0 last:pb-0"
            >
              <div className="flex items-start gap-3">
                <Avatar src={review.user.image} name={review.user.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-medium text-text-primary text-sm">
                      {review.user.name}
                    </h4>
                    <span className="text-xs text-text-tertiary">{formatDate(review.createdAt)}</span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                  {review.comment && (
                    <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-text-tertiary">
          <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-text-secondary">No reviews yet</p>
          <p className="text-sm">Be the first to review this course.</p>
        </div>
      )}
    </div>
  );

  const instructorContent = (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Avatar src={course.instructor.image} name={course.instructor.name} size="xl" />
        <div>
          <h3 className="text-xl font-semibold text-text-primary">
            {course.instructor.name}
          </h3>
          <p className="text-sm text-text-secondary mb-2">Instructor</p>
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {course.instructor._count.courses} course{course.instructor._count.courses !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {course._count.enrollments} student{course._count.enrollments !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
      {course.instructor.bio && (
        <p className="text-text-secondary leading-relaxed">
          {course.instructor.bio}
        </p>
      )}
    </div>
  );

  const announcementsContent = (
    <div className="space-y-4">
      {announcements.length > 0 ? (
        announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="border-b border-white/[0.06] pb-4 last:border-0 last:pb-0"
          >
            <div className="flex items-start justify-between gap-4 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <Megaphone className="h-4 w-4 text-brand flex-shrink-0" />
                <h4 className="font-semibold text-text-primary text-sm truncate">
                  {announcement.title}
                </h4>
              </div>
              <span className="text-xs text-text-tertiary whitespace-nowrap flex-shrink-0">
                {formatDate(announcement.createdAt)}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line ml-6">
              {announcement.content}
            </p>
            <p className="text-xs text-text-muted mt-1 ml-6">
              By {announcement.user.name || "Instructor"}
            </p>
          </div>
        ))
      ) : (
        <div className="text-center py-12 text-text-tertiary">
          <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-text-secondary">No announcements yet</p>
          <p className="text-sm">The instructor hasn&apos;t posted any announcements.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-surface-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-surface-3 via-surface-2 to-surface-0 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Course Info */}
            <div className="flex-1 min-w-0">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-2 text-sm text-text-tertiary mb-4">
                <Link href="/courses" className="hover:text-text-primary transition-colors">Courses</Link>
                <ChevronRight className="h-3.5 w-3.5" />
                {course.category && (
                  <>
                    <Link
                      href={`/courses?category=${course.category.slug}`}
                      className="hover:text-text-primary transition-colors"
                    >
                      {course.category.name}
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
                <span className="text-text-secondary truncate">{course.title}</span>
              </nav>

              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 leading-tight">
                {course.title}
              </h1>

              {course.shortDescription && (
                <p className="text-lg text-text-secondary mb-6 max-w-2xl leading-relaxed">
                  {course.shortDescription}
                </p>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  <StarRating rating={avgRating} size="sm" showValue />
                  <span className="text-sm text-text-tertiary ml-1">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
                </div>
                <span className="text-sm text-text-tertiary flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course._count.enrollments} student{course._count.enrollments !== 1 ? "s" : ""}
                </span>
                <Badge variant={getLevelBadgeVariant(course.level)} size="md">
                  {course.level}
                </Badge>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-3 mb-6">
                <Avatar src={course.instructor.image} name={course.instructor.name} size="sm" />
                <div>
                  <p className="text-sm text-text-tertiary">Created by</p>
                  <p className="text-sm font-medium text-text-primary">{course.instructor.name}</p>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-text-tertiary">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Updated {formatDate(course.updatedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {course.language}
                </span>
                {course.certificateEnabled && (
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-gold" />
                    Certificate included
                  </span>
                )}
              </div>
            </div>

            {/* Course Card / Sidebar */}
            <div className="lg:w-[380px] flex-shrink-0">
              <Card className="overflow-hidden shadow-[0_0_20px_rgba(0,255,204,0.05)] lg:sticky lg:top-24">
                <CoursePreviewMedia
                  title={course.title}
                  thumbnail={course.thumbnail}
                  previewVideo={course.previewVideo}
                />

                <CardContent className="p-6 space-y-4">
                  {/* Price */}
                  <div className="flex items-center gap-3">
                    {course.isFree ? (
                      <span className="text-3xl font-bold text-brand">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-text-primary">
                          {formatPrice(effectivePrice, priceCurrency)}
                        </span>
                        {course.discountPrice != null &&
                          Number(course.discountPrice) < Number(course.price) && (
                          <span className="text-lg text-text-tertiary line-through">
                            {formatPrice(course.price, priceCurrency)}
                          </span>
                        )}
                        {course.discountPrice != null &&
                          Number(course.discountPrice) < Number(course.price) && (
                          <Badge variant="danger" size="md">
                            {Math.round(
                              ((Number(course.price) - Number(course.discountPrice)) /
                                Number(course.price)) *
                                100
                            )}
                            % off
                          </Badge>
                        )}
                      </>
                    )}
                  </div>

                  {/* CTA Button */}
                  <EnrollButton
                    courseId={course.id}
                    courseSlug={course.slug}
                    isFree={course.isFree || effectivePrice === 0}
                    isEnrolled={!!isEnrolled}
                    enrollmentStatus={enrollment?.status ?? null}
                    firstLessonId={firstLessonId}
                    price={effectivePrice}
                    formattedPrice={
                      course.isFree ? undefined : formatPrice(effectivePrice, priceCurrency)
                    }
                    className="w-full"
                  />

                  {/* Course Stats */}
                  <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Duration
                      </span>
                      <span className="font-medium text-text-primary">
                        {formatDuration(totalDuration || course.duration)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Lessons
                      </span>
                      <span className="font-medium text-text-primary">
                        {totalLessons || course.totalLessons}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary flex items-center gap-2">
                        <Users className="h-4 w-4" /> Enrolled
                      </span>
                      <span className="font-medium text-text-primary">
                        {course._count.enrollments} student{course._count.enrollments !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" /> Level
                      </span>
                      <Badge variant={getLevelBadgeVariant(course.level)} size="sm">
                        {course.level}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Language
                      </span>
                      <span className="font-medium text-text-primary">{course.language}</span>
                    </div>
                    {course.certificateEnabled && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary flex items-center gap-2">
                          <Award className="h-4 w-4" /> Certificate
                        </span>
                        <Badge variant="success" size="sm">Included</Badge>
                      </div>
                    )}
                    {course.passingGrade > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary flex items-center gap-2">
                          <Shield className="h-4 w-4" /> Passing Grade
                        </span>
                        <span className="font-medium text-text-primary">{course.passingGrade}%</span>
                      </div>
                    )}
                  </div>

                  {/* Enrollment progress for enrolled users */}
                  {isEnrolled && enrollment && (
                    <div className="pt-4 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-text-secondary">Your Progress</span>
                        <span className="font-medium text-text-primary">
                          {Math.round(enrollment.progress)}%
                        </span>
                      </div>
                      <Progress
                        value={enrollment.progress}
                        max={100}
                        color={enrollment.progress >= 100 ? "brand" : "blue"}
                        size="md"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="lg:pr-[412px]">
          <Tabs
            tabs={[
              {
                id: "overview",
                label: "Overview",
                icon: <BookOpen className="h-4 w-4" />,
                content: overviewContent,
              },
              {
                id: "curriculum",
                label: `Curriculum (${totalLessons})`,
                icon: <PlayCircle className="h-4 w-4" />,
                content: curriculumContent,
              },
              {
                id: "reviews",
                label: `Reviews (${reviews.length})`,
                icon: <Star className="h-4 w-4" />,
                content: reviewsContent,
              },
              {
                id: "instructor",
                label: "Instructor",
                icon: <GraduationCap className="h-4 w-4" />,
                content: instructorContent,
              },
              {
                id: "announcements",
                label: `Announcements (${announcements.length})`,
                icon: <Megaphone className="h-4 w-4" />,
                content: announcementsContent,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
