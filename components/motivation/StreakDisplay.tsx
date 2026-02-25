"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  weeklyGoal: number;
  weeklyProgress: number;
}

export function StreakDisplay({
  currentStreak,
  longestStreak,
  weeklyGoal,
  weeklyProgress,
}: StreakDisplayProps) {
  const t = useTranslations();

  const progressPercentage = weeklyGoal > 0 
    ? Math.min((weeklyProgress / weeklyGoal) * 100, 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("behavioral.currentStreak")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-orange-500">
              {currentStreak}
            </div>
            <div className="text-sm text-gray-600">
              días consecutivos
              <br />
              <span className="text-xs">
                Récord: {longestStreak} días
              </span>
            </div>
          </div>
          {currentStreak > 0 && (
            <div className="mt-4 flex gap-1">
              {Array.from({ length: Math.min(currentStreak, 7) }).map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                >
                  🔥
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("behavioral.weeklyGoal")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{weeklyProgress} / {weeklyGoal} tareas</span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

