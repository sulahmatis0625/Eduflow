import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Trophy, Medal, Crown, Star, Flame, TrendingUp,
  Award, Zap, Target, Users,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard - EduFlow",
  description: "See the top students on EduFlow ranked by experience points. Compete, learn, and climb the ranks.",
};

function getRankIcon(rank: number) {
  switch (rank) {
    case 1: return <Crown className="h-6 w-6 text-gold" />;
    case 2: return <Medal className="h-6 w-6 text-text-secondary" />;
    case 3: return <Medal className="h-6 w-6 text-amber-600" />;
    default: return null;
  }
}

function getRankBg(rank: number) {
  switch (rank) {
    case 1: return "bg-gold/5 border-gold/20";
    case 2: return "bg-white/[0.03] border-white/[0.08]";
    case 3: return "bg-amber-500/5 border-amber-500/20";
    default: return "bg-white/[0.03] border-white/[0.06]";
  }
}

function getLevelTitle(level: number) {
  if (level >= 50) return "Grandmaster";
  if (level >= 40) return "Master";
  if (level >= 30) return "Expert";
  if (level >= 20) return "Advanced";
  if (level >= 10) return "Intermediate";
  if (level >= 5) return "Apprentice";
  return "Beginner";
}

function getLevelColor(level: number) {
  if (level >= 50) return "purple";
  if (level >= 40) return "danger";
  if (level >= 30) return "warning";
  if (level >= 20) return "info";
  if (level >= 10) return "success";
  return "default";
}

interface LeaderboardUser {
  id: string;
  name: string | null;
  image: string | null;
  xp: number;
  level: number;
  _count: {
    achievements: number;
    enrollments: number;
    certificates: number;
  };
}

async function getLeaderboardData(period: "all" | "month" | "week"): Promise<LeaderboardUser[]> {
  const now = new Date();
  let dateFilter: Date | undefined;

  if (period === "month") {
    dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "week") {
    const dayOfWeek = now.getDay();
    dateFilter = new Date(now);
    dateFilter.setDate(now.getDate() - dayOfWeek);
    dateFilter.setHours(0, 0, 0, 0);
  }

  // For all time, just get top users by XP
  // For time periods, we still rank by total XP but could filter active users
  const users = await db.user.findMany({
    where: {
      isActive: true,
      role: { not: "ADMIN" },
      ...(dateFilter ? { updatedAt: { gte: dateFilter } } : {}),
    },
    select: {
      id: true,
      name: true,
      image: true,
      xp: true,
      level: true,
      _count: {
        select: {
          achievements: true,
          enrollments: true,
          certificates: true,
        },
      },
    },
    orderBy: { xp: "desc" },
    take: 50,
  });

  return users;
}

export default async function LeaderboardPage() {
  const session = await auth();

  const [allTimeUsers, monthUsers, weekUsers] = await Promise.all([
    getLeaderboardData("all"),
    getLeaderboardData("month"),
    getLeaderboardData("week"),
  ]);

  // Get total user count for stats
  const totalStudents = await db.user.count({
    where: { isActive: true, role: { not: "ADMIN" } },
  }).catch(() => 0);

  const topXp = allTimeUsers.length > 0 ? allTimeUsers[0].xp : 0;

  function renderLeaderboard(
    users: typeof allTimeUsers,
    emptyMessage: string
  ) {
    if (users.length === 0) {
      return (
        <EmptyState
          icon={<Trophy className="h-16 w-16" />}
          title="No rankings yet"
          description={emptyMessage}
        />
      );
    }

    return (
      <div className="space-y-3">
        {/* Top 3 Podium */}
        {users.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {/* 2nd Place */}
            <div className="flex flex-col items-center pt-8">
              <div className="relative">
                <Avatar src={users[1].image} name={users[1].name} size="lg" />
                <div className="absolute -bottom-1 -right-1 bg-white/[0.15] text-text-secondary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border border-white/[0.08]">
                  2
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold text-text-primary text-center truncate max-w-full">
                {users[1].name || "Anonymous"}
              </p>
              <p className="text-xs text-text-secondary">{users[1].xp.toLocaleString()} XP</p>
              <Badge variant={getLevelColor(users[1].level) as any} size="sm" className="mt-1">
                Lv. {users[1].level}
              </Badge>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <Crown className="h-8 w-8 text-gold mb-1" />
              <div className="relative">
                <div className="ring-4 ring-gold/30 rounded-full">
                  <Avatar src={users[0].image} name={users[0].name} size="xl" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-gold text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  1
                </div>
              </div>
              <p className="mt-2 text-sm font-bold text-text-primary text-center truncate max-w-full">
                {users[0].name || "Anonymous"}
              </p>
              <p className="text-xs text-text-secondary font-medium">{users[0].xp.toLocaleString()} XP</p>
              <Badge variant={getLevelColor(users[0].level) as any} size="sm" className="mt-1">
                Lv. {users[0].level}
              </Badge>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center pt-12">
              <div className="relative">
                <Avatar src={users[2].image} name={users[2].name} size="lg" />
                <div className="absolute -bottom-1 -right-1 bg-amber-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  3
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold text-text-primary text-center truncate max-w-full">
                {users[2].name || "Anonymous"}
              </p>
              <p className="text-xs text-text-secondary">{users[2].xp.toLocaleString()} XP</p>
              <Badge variant={getLevelColor(users[2].level) as any} size="sm" className="mt-1">
                Lv. {users[2].level}
              </Badge>
            </div>
          </div>
        )}

        {/* Full Rankings List */}
        <div className="space-y-2">
          {users.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = session?.user?.id === user.id;
            const xpProgress = topXp > 0 ? (user.xp / topXp) * 100 : 0;

            return (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-all",
                  getRankBg(rank),
                  isCurrentUser && "ring-2 ring-brand ring-offset-1 ring-offset-surface-0"
                )}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
                  {getRankIcon(rank) || (
                    <span className="text-lg font-bold text-text-tertiary">
                      {rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar src={user.image} name={user.name} size="md" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={cn(
                      "font-semibold truncate",
                      isCurrentUser
                        ? "text-brand"
                        : "text-text-primary"
                    )}>
                      {user.name || "Anonymous"}
                      {isCurrentUser && (
                        <span className="text-xs font-normal text-brand/70 ml-1.5">(You)</span>
                      )}
                    </h3>
                    <Badge variant={getLevelColor(user.level) as any} size="sm">
                      Lv. {user.level} - {getLevelTitle(user.level)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex-1 max-w-[200px] hidden sm:block">
                      <Progress
                        value={xpProgress}
                        max={100}
                        size="sm"
                        color={rank <= 3 ? "amber" as any : "blue"}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1" title="Achievements">
                        <Award className="h-3.5 w-3.5" />
                        {user._count.achievements}
                      </span>
                      <span className="flex items-center gap-1" title="Courses Enrolled">
                        <Target className="h-3.5 w-3.5" />
                        {user._count.enrollments}
                      </span>
                      <span className="flex items-center gap-1" title="Certificates">
                        <Star className="h-3.5 w-3.5" />
                        {user._count.certificates}
                      </span>
                    </div>
                  </div>
                </div>

                {/* XP */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-gold" />
                    <span className="text-lg font-bold text-text-primary">
                      {user.xp.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-text-tertiary">XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Find current user's rank
  const currentUserRank = session?.user?.id
    ? allTimeUsers.findIndex((u) => u.id === session.user.id) + 1
    : 0;

  return (
    <div className="bg-surface-0 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-gold/10 via-surface-2 to-surface-0 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-gold/10 p-2.5 rounded-xl border border-gold/20">
                  <Trophy className="h-7 w-7 text-gold" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Leaderboard</h1>
              </div>
              <p className="text-text-secondary text-lg max-w-lg">
                Compete with fellow learners, earn XP by completing courses and achievements, and climb the ranks.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-text-primary">{totalStudents.toLocaleString()}</div>
                <div className="text-xs text-text-muted">Total Students</div>
              </div>
              {currentUserRank > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-gold">#{currentUserRank}</div>
                  <div className="text-xs text-text-muted">Your Rank</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Current user banner */}
        {session?.user?.id && currentUserRank > 0 && (
          <Card className="mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-brand/10 to-brand/5 p-4 flex items-center justify-between border-l-2 border-brand">
              <div className="flex items-center gap-3 text-text-primary">
                <Flame className="h-5 w-5 text-brand" />
                <span className="font-medium">
                  You are ranked <span className="font-bold text-brand">#{currentUserRank}</span> out of {totalStudents.toLocaleString()} students.
                  {currentUserRank <= 10 && " Amazing work!"}
                  {currentUserRank > 10 && currentUserRank <= 25 && " Keep going!"}
                  {currentUserRank > 25 && " Complete more courses to climb the ranks!"}
                </span>
              </div>
              <TrendingUp className="h-5 w-5 text-brand/50" />
            </div>
          </Card>
        )}

        <Tabs
          tabs={[
            {
              id: "all-time",
              label: "All Time",
              icon: <Trophy className="h-4 w-4" />,
              content: renderLeaderboard(
                allTimeUsers,
                "No students have earned XP yet. Be the first!"
              ),
            },
            {
              id: "this-month",
              label: "This Month",
              icon: <Flame className="h-4 w-4" />,
              content: renderLeaderboard(
                monthUsers,
                "No activity this month yet. Start learning to appear on the leaderboard!"
              ),
            },
            {
              id: "this-week",
              label: "This Week",
              icon: <Zap className="h-4 w-4" />,
              content: renderLeaderboard(
                weekUsers,
                "No activity this week yet. Start learning to appear on the leaderboard!"
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
