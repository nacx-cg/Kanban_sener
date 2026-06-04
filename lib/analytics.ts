import { prisma } from "./db";

export interface ProductivityMetrics {
  tasksCompletedToday: number;
  tasksCompletedWeek: number;
  tasksCompletedMonth: number;
  completionRate: number;
  averageCompletionTime: number;
  tasksByStatus: Record<string, number>;
}

export interface WorkPatternAnalysis {
  lateWorkCount: number;
  lateWorkPercentage: number;
  peakHours: number[];
  averageCompletionTimeByWorkType: Record<string, number>;
  workTypeDistribution: Record<string, number>;
  weakLinks: Array<{
    workType: string;
    completionRate: number;
    averageWaitTime: number;
  }>;
}

export async function getProductivityMetrics(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ProductivityMetrics> {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now);
  monthStart.setMonth(monthStart.getMonth() - 1);

  const where: any = {
    board: {
      userId,
    },
    completedAt: {
      not: null,
    },
  };

  if (startDate || endDate) {
    where.completedAt = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };
  }

  const allCompletedTasks = await prisma.task.findMany({
    where: {
      board: { userId },
      completedAt: { not: null },
    },
    select: {
      completedAt: true,
      createdAt: true,
      status: true,
    },
  });

  const tasksCompletedToday = allCompletedTasks.filter(
    (task) =>
      task.completedAt &&
      new Date(task.completedAt) >= todayStart
  ).length;

  const tasksCompletedWeek = allCompletedTasks.filter(
    (task) =>
      task.completedAt &&
      new Date(task.completedAt) >= weekStart
  ).length;

  const tasksCompletedMonth = allCompletedTasks.filter(
    (task) =>
      task.completedAt &&
      new Date(task.completedAt) >= monthStart
  ).length;

  const allTasks = await prisma.task.findMany({
    where: {
      board: { userId },
    },
  });

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completedAt).length;
  const completionRate =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate average completion time
  const completedTasksWithTime = allCompletedTasks.filter(
    (t) => t.completedAt && t.createdAt
  );
  const totalCompletionTime = completedTasksWithTime.reduce((sum, task) => {
    if (task.completedAt && task.createdAt) {
      return (
        sum +
        (new Date(task.completedAt).getTime() -
          new Date(task.createdAt).getTime())
      );
    }
    return sum;
  }, 0);
  const averageCompletionTime =
    completedTasksWithTime.length > 0
      ? totalCompletionTime / completedTasksWithTime.length / (1000 * 60 * 60) // Convert to hours
      : 0;

  // Tasks by status
  const tasksByStatus: Record<string, number> = {};
  allTasks.forEach((task) => {
    tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
  });

  return {
    tasksCompletedToday,
    tasksCompletedWeek,
    tasksCompletedMonth,
    completionRate,
    averageCompletionTime,
    tasksByStatus,
  };
}

export async function getWorkPatternAnalysis(
  userId: string,
  workHoursStart: number = 9,
  workHoursEnd: number = 18
): Promise<WorkPatternAnalysis> {
  const completedTasks = await prisma.task.findMany({
    where: {
      board: { userId },
      completedAt: { not: null },
    },
    select: {
      completedAt: true,
      workType: true,
      createdAt: true,
      timeInColumns: true,
    },
  });

  // Late work detection
  const lateWorkTasks = completedTasks.filter((task) => {
    if (!task.completedAt) return false;
    const completedHour = new Date(task.completedAt).getHours();
    return completedHour < workHoursStart || completedHour >= workHoursEnd;
  });

  const lateWorkCount = lateWorkTasks.length;
  const lateWorkPercentage =
    completedTasks.length > 0
      ? (lateWorkCount / completedTasks.length) * 100
      : 0;

  // Peak hours analysis
  const hourCounts: Record<number, number> = {};
  completedTasks.forEach((task) => {
    if (task.completedAt) {
      const hour = new Date(task.completedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  const peakHours = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // Average completion time by work type
  const workTypeTimes: Record<string, number[]> = {};
  completedTasks.forEach((task) => {
    if (task.completedAt && task.createdAt) {
      const timeDiff =
        new Date(task.completedAt).getTime() -
        new Date(task.createdAt).getTime();
      if (!workTypeTimes[task.workType]) {
        workTypeTimes[task.workType] = [];
      }
      workTypeTimes[task.workType].push(timeDiff);
    }
  });

  const averageCompletionTimeByWorkType: Record<string, number> = {};
  Object.entries(workTypeTimes).forEach(([workType, times]) => {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    averageCompletionTimeByWorkType[workType] = avg / (1000 * 60 * 60); // Convert to hours
  });

  // Work type distribution
  const workTypeDistribution: Record<string, number> = {};
  completedTasks.forEach((task) => {
    workTypeDistribution[task.workType] =
      (workTypeDistribution[task.workType] || 0) + 1;
  });

  // Weak link identification
  const allTasks = await prisma.task.findMany({
    where: {
      board: { userId },
    },
    select: {
      workType: true,
      completedAt: true,
      createdAt: true,
      timeInColumns: true,
    },
  });

  const workTypeStats: Record<
    string,
    { total: number; completed: number; totalWaitTime: number }
  > = {};

  allTasks.forEach((task) => {
    if (!workTypeStats[task.workType]) {
      workTypeStats[task.workType] = {
        total: 0,
        completed: 0,
        totalWaitTime: 0,
      };
    }
    workTypeStats[task.workType].total++;
    if (task.completedAt) {
      workTypeStats[task.workType].completed++;
    }

    // Calculate wait time from timeInColumns
    if (task.timeInColumns && typeof task.timeInColumns === "object") {
      const timeInColumns = task.timeInColumns as Record<string, number>;
      const totalWait = Object.values(timeInColumns).reduce(
        (sum, time) => sum + (time || 0),
        0
      );
      workTypeStats[task.workType].totalWaitTime += totalWait;
    }
  });

  const weakLinks = Object.entries(workTypeStats)
    .map(([workType, stats]) => {
      const completionRate =
        stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      const averageWaitTime =
        stats.completed > 0
          ? stats.totalWaitTime / stats.completed / (1000 * 60 * 60) // Convert to hours
          : 0;

      return {
        workType,
        completionRate,
        averageWaitTime,
      };
    })
    .filter((link) => link.completionRate < 50 || link.averageWaitTime > 24)
    .sort((a, b) => a.completionRate - b.completionRate);

  return {
    lateWorkCount,
    lateWorkPercentage,
    peakHours,
    averageCompletionTimeByWorkType,
    workTypeDistribution,
    weakLinks,
  };
}

export interface UserCompletionMetric {
  userId: string;
  userName: string | null;
  userEmail: string;
  tasksCompletedToday: number;
  tasksCompletedWeek: number;
  tasksCompletedMonth: number;
  totalCompleted: number;
  totalAssigned: number;
  completionRate: number;
}

/**
 * Get task completion metrics per user (for admin).
 * Counts tasks where assigneeId = user and completedAt is not null.
 */
export async function getTaskCompletionMetricsPerUser(): Promise<
  UserCompletionMetric[]
> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now);
  monthStart.setMonth(monthStart.getMonth() - 1);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const tasks = await prisma.task.findMany({
    where: { assigneeId: { not: null } },
    select: {
      assigneeId: true,
      completedAt: true,
    },
  });

  const metrics: UserCompletionMetric[] = users.map((user) => {
    const userTasks = tasks.filter((t) => t.assigneeId === user.id);
    const completedTasks = userTasks.filter((t) => t.completedAt != null);

    const tasksCompletedToday = completedTasks.filter(
      (t) => t.completedAt && new Date(t.completedAt) >= todayStart
    ).length;
    const tasksCompletedWeek = completedTasks.filter(
      (t) => t.completedAt && new Date(t.completedAt) >= weekStart
    ).length;
    const tasksCompletedMonth = completedTasks.filter(
      (t) => t.completedAt && new Date(t.completedAt) >= monthStart
    ).length;

    const totalAssigned = userTasks.length;
    const totalCompleted = completedTasks.length;
    const completionRate =
      totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      tasksCompletedToday,
      tasksCompletedWeek,
      tasksCompletedMonth,
      totalCompleted,
      totalAssigned,
      completionRate,
    };
  });

  return metrics.sort((a, b) => b.totalCompleted - a.totalCompleted);
}

export interface MeetingHoursPerUser {
  userId: string;
  userName: string | null;
  userEmail: string;
  totalHours: number;
  meetings: Array<{ meetingId: string; meetingTitle: string; hours: number }>;
}

/**
 * Get meeting hours per user (for admin analytics).
 * Returns users with their total meeting hours and breakdown by meeting.
 */
export async function getMeetingHoursPerUser(): Promise<{
  users: MeetingHoursPerUser[];
  meetings: Array<{ id: string; title: string }>;
  byDay: Array<Record<string, string | number>>;
  byDayMeetingDetails: Record<
    string,
    Record<string, Array<{ meetingTitle: string; hours: number }>>
  >;
}> {
  const meetings = await prisma.meeting.findMany({
    include: {
      attendants: true,
    },
    orderBy: { date: 'desc' },
  });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });

  const usersWithHours: MeetingHoursPerUser[] = users.map((user) => {
    let totalHours = 0;
    const meetingBreakdown: Array<{ meetingId: string; meetingTitle: string; hours: number }> = [];

    for (const meeting of meetings) {
      const att = meeting.attendants.find(
        (a: { userId: string }) => a.userId === user.id
      );
      const hours = att ? meeting.hoursAttended : 0;
      if (hours > 0) {
        totalHours += hours;
        meetingBreakdown.push({
          meetingId: meeting.id,
          meetingTitle: meeting.title || `Reunión ${meeting.date.toISOString().slice(0, 10)}`,
          hours,
        });
      }
    }

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      totalHours,
      meetings: meetingBreakdown,
    };
  });

  const filtered = usersWithHours
    .filter((u) => u.totalHours > 0)
    .sort((a, b) => b.totalHours - a.totalHours);

  // Build byDay: one row per date, hours per user (for stacked bar: X=day, Y=hours, stack=user)
  // Build byDayMeetingDetails: per (date, userId) list of meetings with titles for tooltip
  const dateToRow = new Map<string, Record<string, string | number>>();
  const byDayMeetingDetails: Record<
    string,
    Record<string, Array<{ meetingTitle: string; hours: number }>>
  > = {};
  for (const meeting of meetings) {
    const dateStr = meeting.date.toISOString().slice(0, 10);
    const meetingTitle =
      meeting.title || `Reunión ${meeting.date.toISOString().slice(0, 10)}`;
    if (!dateToRow.has(dateStr)) {
      dateToRow.set(dateStr, { date: dateStr });
      byDayMeetingDetails[dateStr] = {};
    }
    const row = dateToRow.get(dateStr)!;
    for (const att of meeting.attendants) {
      const key = att.userId;
      (row as Record<string, number>)[key] =
        ((row[key] as number) || 0) + meeting.hoursAttended;
      if (!byDayMeetingDetails[dateStr][key]) {
        byDayMeetingDetails[dateStr][key] = [];
      }
      byDayMeetingDetails[dateStr][key].push({
        meetingTitle,
        hours: meeting.hoursAttended,
      });
    }
  }
  const byDay = Array.from(dateToRow.values()).sort(
    (a, b) => (a.date as string).localeCompare(b.date as string)
  );

  return {
    users: filtered,
    meetings: meetings.map((m: { id: string; title: string | null; date: Date }) => ({
      id: m.id,
      title: m.title || `Reunión ${m.date.toISOString().slice(0, 10)}`,
    })),
    byDay,
    byDayMeetingDetails,
  };
}

