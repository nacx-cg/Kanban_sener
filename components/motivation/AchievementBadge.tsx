"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Achievement {
  id: string;
  type: string;
  unlockedAt: Date | string;
  metadata?: Record<string, any>;
}

interface AchievementBadgeProps {
  achievement: Achievement;
}

const achievementIcons: Record<string, string> = {
  "First Task": "🎯",
  "10 Tasks": "⭐",
  "50 Tasks": "🌟",
  "100 Tasks": "💫",
  "Week Warrior": "🏆",
  "7 Day Streak": "🔥",
  "30 Day Streak": "💎",
  "Early Bird": "🌅",
  "Night Owl": "🦉",
};

const achievementNames: Record<string, string> = {
  "First Task": "Primera Tarea",
  "10 Tasks": "10 Tareas",
  "50 Tasks": "50 Tareas",
  "100 Tasks": "100 Tareas",
  "Week Warrior": "Guerrero Semanal",
  "7 Day Streak": "Racha de 7 Días",
  "30 Day Streak": "Racha de 30 Días",
  "Early Bird": "Madrugador",
  "Night Owl": "Búho Nocturno",
};

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl">
            {achievementIcons[achievement.type] || "🏅"}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">
              {achievementNames[achievement.type] || achievement.type}
            </h3>
            <p className="text-sm text-gray-500">
              {format(
                new Date(achievement.unlockedAt),
                "dd 'de' MMMM, yyyy",
                { locale: es }
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

