import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getLevelFromXp,
  getXpForNextLevel,
  getXpProgress,
  formatDate,
  cn,
} from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Trophy, Zap, Lock, Star, Shield, Crown, Gem } from "lucide-react";

export const metadata = {
  title: "My Achievements | EduFlow",
};

const tierConfig: Record<
  string,
  { color: string; bgColor: string; borderColor: string; icon: typeof Trophy; badgeVariant: "default" | "success" | "warning" | "info" | "purple" }
> = {
  BRONZE: {
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    icon: Shield,
    badgeVariant: "warning",
  },
  SILVER: {
    color: "text-text-secondary",
    bgColor: "bg-white/[0.05]",
    borderColor: "border-white/[0.08]",
    icon: Star,
    badgeVariant: "default",
  },
  GOLD: {
    color: "text-gold",
    bgColor: "bg-gold/10",
    borderColor: "border-gold/20",
    icon: Crown,
    badgeVariant: "warning",
  },
  PLATINUM: {
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    icon: Gem,
    badgeVariant: "purple",
  },
};

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;

  const [user, userAchievements, allAchievements] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    }),
    db.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    }),
    db.achievement.findMany({
      orderBy: [{ tier: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!user) redirect("/login");

  const userXp = user.xp ?? 0;
  const userLevel = getLevelFromXp(userXp);
  const xpProgress = getXpProgress(userXp);
  const earnedIds = new Set(userAchievements.map((ua) => ua.achievementId));
  const earnedCount = userAchievements.length;
  const totalCount = allAchievements.length;

  // Group achievements by tier
  const tiers = ["BRONZE", "SILVER", "GOLD", "PLATINUM"] as const;
  const achievementsByTier = tiers.map((tier) => ({
    tier,
    achievements: allAchievements.filter((a) => a.tier === tier),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Achievements & Badges
        </h1>
        <p className="text-text-secondary mt-1">
          Track your progress and unlock achievements
        </p>
      </div>

      {/* XP & Level Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gold/10">
              <Zap className="h-7 w-7 text-gold" />
            </div>
            <div>
              <p className="text-xs text-text-muted">
                Current Level
              </p>
              <p className="text-3xl font-bold text-text-primary">
                {userLevel}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand/10">
              <Star className="h-7 w-7 text-brand" />
            </div>
            <div>
              <p className="text-xs text-text-muted">
                Total XP
              </p>
              <p className="text-3xl font-bold text-text-primary">
                {userXp}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand/10">
              <Trophy className="h-7 w-7 text-brand" />
            </div>
            <div>
              <p className="text-xs text-text-muted">
                Achievements
              </p>
              <p className="text-3xl font-bold text-text-primary">
                {earnedCount}
                <span className="text-base font-normal text-text-tertiary">
                  /{totalCount}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* XP Progress to next level */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-gold" />
              <span className="font-semibold text-text-primary">
                Progress to Level {userLevel + 1}
              </span>
            </div>
            <span className="text-sm text-text-secondary">
              {xpProgress} / 100 XP
            </span>
          </div>
          <Progress value={xpProgress} max={100} color="gold" size="lg" showLabel />
        </CardContent>
      </Card>

      {/* Achievements by Tier */}
      {totalCount === 0 ? (
        <EmptyState
          icon={<Trophy className="h-16 w-16" />}
          title="No achievements available"
          description="Achievements will appear here as they are added to the platform. Keep learning!"
        />
      ) : (
        achievementsByTier.map(({ tier, achievements }) => {
          if (achievements.length === 0) return null;
          const config = tierConfig[tier];
          const TierIcon = config.icon;

          return (
            <div key={tier} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", config.bgColor)}>
                  <TierIcon className={cn("h-5 w-5", config.color)} />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {tier.charAt(0) + tier.slice(1).toLowerCase()} Tier
                </h2>
                <Badge variant={config.badgeVariant}>
                  {achievements.filter((a) => earnedIds.has(a.id)).length}/
                  {achievements.length}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => {
                  const isEarned = earnedIds.has(achievement.id);
                  const userAchievement = userAchievements.find(
                    (ua) => ua.achievementId === achievement.id
                  );

                  return (
                    <Card
                      key={achievement.id}
                      className={cn(
                        "transition-all",
                        !isEarned && "opacity-60 grayscale"
                      )}
                    >
                      <CardContent>
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex-shrink-0 p-3 rounded-xl text-2xl",
                              isEarned
                                ? config.bgColor
                                : "bg-white/[0.02]"
                            )}
                          >
                            {achievement.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-text-primary truncate">
                                {achievement.name}
                              </h3>
                              {!isEarned && (
                                <Lock className="h-3.5 w-3.5 text-text-tertiary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                              {achievement.description}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs font-medium text-gold flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                +{achievement.xpReward} XP
                              </span>
                              {isEarned && userAchievement && (
                                <span className="text-xs text-text-tertiary">
                                  {formatDate(userAchievement.earnedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
