import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  GraduationCap, PlayCircle, Award, Users, BookOpen, Star,
  ArrowRight, CheckCircle, Zap, Globe, Clock, Shield,
  TrendingUp, Video, MessageSquare, BarChart3,
} from "lucide-react";
import { db } from "@/lib/db";

export default async function HomePage() {
  const [courseCount, userCount, certificateCount] = await Promise.all([
    db.course.count({ where: { status: "PUBLISHED" } }).catch(() => 0),
    db.user.count().catch(() => 0),
    db.certificate.count().catch(() => 0),
  ]);

  const featuredCourses = await db.course.findMany({
    where: { status: "PUBLISHED" },
    include: {
      instructor: { select: { name: true, image: true } },
      category: true,
      reviews: true,
    },
    take: 6,
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const categories = await db.category.findMany({
    include: { _count: { select: { courses: true } } },
    take: 8,
  }).catch(() => []);

  return (
    <div className="min-h-screen bg-surface-0 text-text-primary">
      <Navbar />

      {/* ═══════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-surface-0">
        {/* Dot grid pattern */}
        <div className="absolute inset-0 dot-grid" />

        {/* Radial brand glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-36 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Subtitle */}
            <p className="text-base text-text-secondary mb-8 tracking-wide">
              Expert-led courses modeled after <strong className="text-text-primary">Google</strong>, <strong className="text-text-primary">Meta</strong>, <strong className="text-text-primary">Amazon</strong> & more
            </p>

            {/* Main heading — dot-matrix display style */}
            <h1 className="font-dot text-4xl md:text-6xl lg:text-7xl leading-[1.1] mb-6">
              Master new skills{" "}
              <span className="gradient-text">anytime, anywhere</span>
            </h1>

            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand animate-pulse shadow-[0_0_8px_rgba(0,255,204,0.6)]" />
              <span className="text-base text-brand font-medium">Platform is live — new courses added weekly</span>
            </div>

            {/* Animated projectile wave curve */}
            <div className="wave-curve w-full max-w-2xl mx-auto mb-10">
              <svg viewBox="0 0 800 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                <path
                  d="M0 60 C100 60, 150 10, 250 30 S400 70, 500 20 S650 50, 750 15 S800 40, 800 40"
                  stroke="url(#waveGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <defs>
                  <linearGradient id="waveGradient" x1="0" y1="0" x2="800" y2="0">
                    <stop offset="0%" stopColor="rgba(0,255,204,0)" />
                    <stop offset="20%" stopColor="rgba(0,255,204,0.6)" />
                    <stop offset="50%" stopColor="rgba(0,255,204,0.8)" />
                    <stop offset="75%" stopColor="rgba(255,184,0,0.5)" />
                    <stop offset="100%" stopColor="rgba(255,184,0,0)" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gold text-surface-0 font-semibold text-sm rounded-full hover:scale-[1.02] transition-all duration-300"
              >
                Explore Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-white/10 text-white text-sm rounded-full hover:border-white/20 transition-all duration-300"
              >
                <PlayCircle className="h-4 w-4" />
                Start Free Trial
              </Link>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
              {["Video Courses", "Live Classrooms", "Certificates"].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-text-secondary"
                >
                  <CheckCircle className="h-3 w-3 text-brand" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STATS SECTION
      ═══════════════════════════════════════════ */}
      <section className="py-16 bg-surface-0 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-dot text-4xl md:text-5xl text-brand">{courseCount || "500"}+</p>
              <p className="text-xs text-text-tertiary mt-2">Courses</p>
            </div>
            <div>
              <p className="font-dot text-4xl md:text-5xl text-brand">{userCount || "50K"}+</p>
              <p className="text-xs text-text-tertiary mt-2">Students</p>
            </div>
            <div>
              <p className="font-dot text-4xl md:text-5xl text-gold">{certificateCount || "25K"}+</p>
              <p className="text-xs text-text-tertiary mt-2">Certificates Issued</p>
            </div>
            <div>
              <p className="font-dot text-4xl md:text-5xl text-gold">4.8</p>
              <p className="text-xs text-text-tertiary mt-2">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURES SECTION
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-surface-0 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section heading */}
          <div className="text-center mb-16">
            <p className="text-brand text-sm font-medium mb-2">
              Why EduFlow
            </p>
            <h2 className="font-dot text-3xl md:text-4xl">
              Everything you need to learn effectively
            </h2>
          </div>

          {/* 3x3 grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Video, title: "HD Video Courses", desc: "High-quality recorded courses you can watch at your own pace, with bookmarks and notes." },
              { icon: Globe, title: "Live Classrooms", desc: "Join interactive live sessions with instructors, just like Google Meet. Ask questions in real-time." },
              { icon: Award, title: "Certificates", desc: "Earn verified certificates upon completing courses and achieving the required grade." },
              { icon: BarChart3, title: "Student Rankings", desc: "Compete with fellow learners on the leaderboard. Earn XP and climb the ranks." },
              { icon: Shield, title: "Secure Payments", desc: "Pay securely with Stripe. Access is granted only after successful payment verification." },
              { icon: MessageSquare, title: "Discussion Forums", desc: "Engage with instructors and peers. Ask questions, share insights, and collaborate." },
              { icon: TrendingUp, title: "Progress Tracking", desc: "Track your learning progress with detailed analytics. Set goals and achieve them." },
              { icon: Clock, title: "Learn Anytime", desc: "All courses are available 24/7. Learn at your pace, on any device, anywhere." },
              { icon: Users, title: "Expert Instructors", desc: "Learn from industry professionals with years of real-world experience." },
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:border-brand/30 transition-all duration-300"
              >
                <div className="inline-flex p-3 rounded-xl bg-brand/10 mb-4">
                  <feature.icon className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-tertiary leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CATEGORIES SECTION
      ═══════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="py-24 bg-surface-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-12">
              <div>
                <p className="text-brand text-sm font-medium mb-2">
                  Explore
                </p>
                <h2 className="text-3xl font-bold">Browse Categories</h2>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10 text-white text-sm rounded-full hover:border-white/20 transition-all duration-300"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/courses?category=${cat.slug}`}
                  className="group flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-brand/30 transition-all duration-300"
                >
                  <span className="text-2xl">{cat.icon || "📚"}</span>
                  <div>
                    <p className="font-medium text-text-primary group-hover:text-brand transition-colors">
                      {cat.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {cat._count.courses} courses
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          FEATURED COURSES SECTION
      ═══════════════════════════════════════════ */}
      {featuredCourses.length > 0 && (
        <section className="py-24 bg-surface-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-12">
              <div>
                <p className="text-brand text-sm font-medium mb-2">
                  Top Picks
                </p>
                <h2 className="text-3xl font-bold">Featured Courses</h2>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10 text-white text-sm rounded-full hover:border-white/20 transition-all duration-300"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => {
                const avgRating =
                  course.reviews.length > 0
                    ? course.reviews.reduce((sum, r) => sum + r.rating, 0) /
                      course.reviews.length
                    : 0;
                return (
                  <Link key={course.id} href={`/courses/${course.slug}`}>
                    <div className="group bg-surface-2 border border-white/[0.06] rounded-xl overflow-hidden hover:border-brand/20 transition-all duration-300">
                      {/* Thumbnail */}
                      <div className="relative h-48 bg-surface-3 overflow-hidden">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <BookOpen className="h-12 w-12 text-text-muted" />
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-2/80 to-transparent" />

                        {/* Badges */}
                        {course.isFree && (
                          <span className="absolute top-3 left-3 px-2.5 py-1 bg-brand text-surface-0 text-xs font-semibold rounded-md">
                            Free
                          </span>
                        )}
                        {course.level && (
                          <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/10 backdrop-blur-sm text-white/80 text-xs rounded-md">
                            {course.level}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        {course.category && (
                          <span className="text-brand text-xs font-medium">
                            {course.category.name}
                          </span>
                        )}
                        <h3 className="font-semibold text-text-primary mt-1.5 mb-2 line-clamp-2 group-hover:text-brand transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-sm text-text-tertiary mb-3 line-clamp-2">
                          {course.shortDescription || course.description}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3.5 w-3.5 ${
                                  s <= Math.round(avgRating)
                                    ? "fill-gold text-gold"
                                    : "fill-transparent text-text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-text-secondary">
                            {avgRating.toFixed(1)}
                          </span>
                          <span className="text-xs text-text-muted">
                            ({course.reviews.length})
                          </span>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                          <span className="text-sm text-text-tertiary">
                            {course.instructor.name}
                          </span>
                          <span className="text-lg font-bold text-brand">
                            {course.isFree ? "Free" : `$${course.price}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          HOW IT WORKS SECTION
      ═══════════════════════════════════════════ */}
      <section className="py-24 bg-surface-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-brand text-sm font-medium mb-2">
              Getting Started
            </p>
            <h2 className="font-dot text-3xl md:text-4xl">How EduFlow Works</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-brand/0 via-brand/20 to-brand/0" />

            {[
              {
                step: "01",
                title: "Create Account",
                desc: "Sign up for free and set up your learner profile in seconds.",
              },
              {
                step: "02",
                title: "Browse & Enroll",
                desc: "Explore courses by category, read reviews, and enroll in courses you love.",
              },
              {
                step: "03",
                title: "Learn & Practice",
                desc: "Watch video lessons, attend live sessions, take quizzes, and track your progress.",
              },
              {
                step: "04",
                title: "Get Certified",
                desc: "Complete the course, pass the assessments, and earn your verified certificate.",
              },
            ].map((item, i) => (
              <div key={i} className="text-center relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand/10 border border-brand/20 text-brand font-dot text-lg mb-5">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-text-tertiary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════ */}
      <section className="relative py-24 bg-surface-0 overflow-hidden">
        {/* Radial brand glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="font-dot text-3xl md:text-5xl mb-6">
            Ready to start your{" "}
            <span className="gradient-text">learning journey</span>?
          </h2>
          <p className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students already learning on EduFlow. Create your
            free account today and get access to our growing library of courses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gold text-surface-0 font-semibold text-sm rounded-full hover:scale-[1.03] transition-all duration-300"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 border border-white/10 text-white text-sm rounded-full hover:border-white/20 transition-all duration-300"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
