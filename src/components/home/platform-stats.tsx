'use client';

import { useEffect, useState } from "react";
import { Users, BookOpen, Award, Heart } from "lucide-react";

interface PlatformStatsData {
  activeStudents: number;
  courses: number;
  instructors: number;
  satisfaction: number;
}

const defaultStats: PlatformStatsData = {
  activeStudents: 0,
  courses: 0,
  instructors: 0,
  satisfaction: 0,
};

function formatValue(value: number, suffix = "") {
  return `${value.toLocaleString()}${suffix}`;
}

export function PlatformStats() {
  const [stats, setStats] = useState<PlatformStatsData>(defaultStats);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch("/api/register");
        if (!res.ok) return;
        const data = await res.json();
        setStats({
          activeStudents: data.activeStudents ?? 0,
          courses: data.courses ?? 0,
          instructors: data.instructors ?? 0,
          satisfaction: data.satisfaction ?? 0,
        });
      } catch {
        setStats(defaultStats);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur rounded-xl p-5 group hover:border-brand/20 transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-brand" />
        </div>
        <p className="text-3xl font-bold text-white mb-1">{formatValue(stats.activeStudents, "+")}</p>
        <p className="text-sm text-white/85">Active Students</p>
      </div>
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur rounded-xl p-5 group hover:border-brand/20 transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-brand" />
        </div>
        <p className="text-3xl font-bold text-white mb-1">{formatValue(stats.courses, "+")}</p>
        <p className="text-sm text-white/85">Courses</p>
      </div>
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur rounded-xl p-5 group hover:border-brand/20 transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-4 w-4 text-brand" />
        </div>
        <p className="text-3xl font-bold text-white mb-1">{formatValue(stats.instructors, "+")}</p>
        <p className="text-sm text-white/85">Instructors</p>
      </div>
      <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur rounded-xl p-5 group hover:border-brand/20 transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="h-4 w-4 text-brand" />
        </div>
        <p className="text-3xl font-bold text-white mb-1">{formatValue(stats.satisfaction, "%")}</p>
        <p className="text-sm text-white/85">Satisfaction</p>
      </div>
    </div>
  );
}
