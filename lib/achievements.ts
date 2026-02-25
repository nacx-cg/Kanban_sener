import { prisma } from "./db";

export async function checkAndUnlockAchievements(userId: string) {
  const userStats = await prisma.userStats.findUnique({
    where: { userId },
  });

  if (!userStats) return;

  const completedTasks = await prisma.task.count({
    where: {
      board: { userId },
      completedAt: { not: null },
    },
  });

  const achievements = await prisma.achievement.findMany({
    where: { userId },
  });

  const unlockedTypes = new Set(achievements.map((a) => a.type));

  // First Task
  if (completedTasks >= 1 && !unlockedTypes.has("First Task")) {
    await prisma.achievement.create({
      data: {
        userId,
        type: "First Task",
        metadata: { taskCount: 1 },
      },
    });
  }

  // 10 Tasks
  if (completedTasks >= 10 && !unlockedTypes.has("10 Tasks")) {
    await prisma.achievement.create({
      data: {
        userId,
        type: "10 Tasks",
        metadata: { taskCount: 10 },
      },
    });
  }

  // 50 Tasks
  if (completedTasks >= 50 && !unlockedTypes.has("50 Tasks")) {
    await prisma.achievement.create({
      data: {
        userId,
        type: "50 Tasks",
        metadata: { taskCount: 50 },
      },
    });
  }

  // 100 Tasks
  if (completedTasks >= 100 && !unlockedTypes.has("100 Tasks")) {
    await prisma.achievement.create({
      data: {
        userId,
        type: "100 Tasks",
        metadata: { taskCount: 100 },
      },
    });
  }

  // Week Warrior (5 tasks in a week)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekTasks = await prisma.task.count({
    where: {
      board: { userId },
      completedAt: { gte: weekStart },
    },
  });

  if (weekTasks >= 5 && !unlockedTypes.has("Week Warrior")) {
    await prisma.achievement.create({
      data: {
        userId,
        type: "Week Warrior",
        metadata: { weekTasks },
      },
    });
  }

  // Streak achievements
  if (userStats.currentStreak >= 7 && !unlockedTypes.has("7 Day Streak")) {
    await prisma.achievement.create({
      data: {
        userId,
        type: "7 Day Streak",
        metadata: { streak: 7 },
      },
    });
  }

  if (userStats.currentStreak >= 30 && !unlockedTypes.has("30 Day Streak")) {
    await prisma.achievement.create({
      data: {
        userId,
        type: "30 Day Streak",
        metadata: { streak: 30 },
      },
    });
  }
}

export async function updateStreak(userId: string) {
  const userStats = await prisma.userStats.findUnique({
    where: { userId },
  });

  if (!userStats) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = userStats.lastActivityDate
    ? new Date(userStats.lastActivityDate)
    : null;
  const lastActivityDate = lastActivity
    ? new Date(lastActivity.setHours(0, 0, 0, 0))
    : null;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = userStats.currentStreak;
  let newLongestStreak = userStats.longestStreak;

  if (!lastActivityDate || lastActivityDate.getTime() === yesterday.getTime()) {
    // Consecutive day
    newStreak = userStats.currentStreak + 1;
  } else if (lastActivityDate.getTime() < yesterday.getTime()) {
    // Streak broken
    newStreak = 1;
  }

  if (newStreak > newLongestStreak) {
    newLongestStreak = newStreak;
  }

  await prisma.userStats.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: today,
      totalTasksCompleted: {
        increment: 1,
      },
    },
  });
}

