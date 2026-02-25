import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const alerts: any[] = [];

    // Overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
        board: { userId: session.user.id },
        dueDate: {
          lt: new Date(),
        },
        completedAt: null,
      },
      include: {
        board: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    overdueTasks.forEach((task) => {
      alerts.push({
        type: "overdue",
        severity: "high",
        title: "Tarea Vencida",
        message: `La tarea "${task.title}" está vencida`,
        taskId: task.id,
        boardId: task.boardId,
        boardName: task.board.name,
        dueDate: task.dueDate,
      });
    });

    // Tasks approaching due date (within 24 hours)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const approachingDueDate = await prisma.task.findMany({
      where: {
        board: { userId: session.user.id },
        dueDate: {
          gte: new Date(),
          lte: tomorrow,
        },
        completedAt: null,
      },
      include: {
        board: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    approachingDueDate.forEach((task) => {
      alerts.push({
        type: "approaching_due_date",
        severity: "medium",
        title: "Tarea Próxima a Vencer",
        message: `La tarea "${task.title}" vence pronto`,
        taskId: task.id,
        boardId: task.boardId,
        boardName: task.board.name,
        dueDate: task.dueDate,
      });
    });

    // Tasks waiting too long in a column (more than 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const stuckTasks = await prisma.task.findMany({
      where: {
        board: { userId: session.user.id },
        createdAt: {
          lt: weekAgo,
        },
        completedAt: null,
      },
      include: {
        board: {
          select: {
            id: true,
            name: true,
          },
        },
        history: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
      },
    });

    stuckTasks.forEach((task) => {
      const lastMove = task.history[0];
      if (lastMove) {
        const daysSinceMove = Math.floor(
          (Date.now() - new Date(lastMove.timestamp).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (daysSinceMove >= 7) {
          alerts.push({
            type: "stuck",
            severity: "medium",
            title: "Tarea Estancada",
            message: `La tarea "${task.title}" lleva más de 7 días en "${task.status}"`,
            taskId: task.id,
            boardId: task.boardId,
            boardName: task.board.name,
            status: task.status,
            daysStuck: daysSinceMove,
          });
        }
      }
    });

    // Late work alert (if more than 30% of tasks completed after hours)
    const completedTasks = await prisma.task.findMany({
      where: {
        board: { userId: session.user.id },
        completedAt: { not: null },
      },
      select: {
        completedAt: true,
      },
    });

    const workHoursStart = 9;
    const workHoursEnd = 18;
    const lateWorkCount = completedTasks.filter((task) => {
      if (!task.completedAt) return false;
      const hour = new Date(task.completedAt).getHours();
      return hour < workHoursStart || hour >= workHoursEnd;
    }).length;

    const lateWorkPercentage =
      completedTasks.length > 0
        ? (lateWorkCount / completedTasks.length) * 100
        : 0;

    if (lateWorkPercentage > 30) {
      alerts.push({
        type: "late_work",
        severity: "low",
        title: "Alerta de Trabajo Tardío",
        message: `El ${lateWorkPercentage.toFixed(1)}% de tus tareas se completan fuera del horario laboral`,
        percentage: lateWorkPercentage,
      });
    }

    // Bottleneck detection (column with too many tasks)
    const boards = await prisma.board.findMany({
      where: { userId: session.user.id },
      include: {
        tasks: {
          where: {
            completedAt: null,
          },
        },
      },
    });

    boards.forEach((board) => {
      const tasksByStatus: Record<string, number> = {};
      board.tasks.forEach((task) => {
        tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
      });

      Object.entries(tasksByStatus).forEach(([status, count]) => {
        if (count > 10) {
          alerts.push({
            type: "bottleneck",
            severity: "medium",
            title: "Cuello de Botella",
            message: `La columna "${status}" tiene ${count} tareas. Considera redistribuir el trabajo.`,
            boardId: board.id,
            boardName: board.name,
            status,
            count,
          });
        }
      });
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Error al obtener las alertas" },
      { status: 500 }
    );
  }
}

