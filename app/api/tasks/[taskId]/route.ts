import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { userHasBoardAccess } from '@/lib/team-helpers';
import { isAdmin, isAdminOrManagerUser } from '@/lib/auth-helpers';
import { z } from 'zod';
import { writeAuditLog } from '@/lib/audit';

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  workType: z.enum(['feature', 'bug', 'task', 'research']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['todo', 'inProgress', 'review', 'done', 'archivo']).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();
    const { taskId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        board: true,
        history: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    // Verify user has access to board
    const hasAccess = await userHasBoardAccess(session.user.id, task.boardId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Error al obtener tarea' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();
    const { taskId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { board: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    // Verify user has access to board
    const hasAccess = await userHasBoardAccess(session.user.id, task.boardId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const data = updateTaskSchema.parse(body);

    // Check if user is admin
    const userIsAdmin = isAdmin(session.user.email);

    // Validate assignee for team-shared boards
    let finalAssigneeId = data.assigneeId;
    if (task.board.teamId && !userIsAdmin && data.assigneeId !== undefined) {
      // On team-shared boards, non-admin users can only assign to themselves
      if (data.assigneeId && data.assigneeId !== session.user.id) {
        return NextResponse.json(
          { error: 'Solo puedes asignar tareas a ti mismo en tableros compartidos' },
          { status: 403 }
        );
      }
      // Force assign to current user if assigneeId was provided but user is not admin
      finalAssigneeId = session.user.id;
    }

    const oldStatus = task.status;
    const newStatus = data.status || task.status;

    // Archive: only admin or manager can move from done to archivo
    if (newStatus === 'archivo') {
      if (oldStatus !== 'done') {
        return NextResponse.json(
          { error: 'Solo se pueden archivar tareas completadas' },
          { status: 400 }
        );
      }
      const canArchive = await isAdminOrManagerUser(session.user.id);
      if (!canArchive) {
        return NextResponse.json(
          { error: 'Solo administradores y managers pueden archivar tareas' },
          { status: 403 }
        );
      }
    }

    // Build update payload - only include defined fields with correct types
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.workType !== undefined) updateData.workType = data.workType;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    updateData.assigneeId = finalAssigneeId;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.tags !== undefined) updateData.tags = data.tags;

    if (newStatus === 'inProgress' && oldStatus !== 'inProgress' && !task.startedAt) {
      updateData.startedAt = new Date();
    }

    if (newStatus === 'done' && oldStatus !== 'done') {
      updateData.completedAt = new Date();

      // Update streak and check achievements
      const { updateStreak, checkAndUnlockAchievements } = await import('@/lib/achievements');
      await updateStreak(session.user.id);
      await checkAndUnlockAchievements(session.user.id);
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData as Parameters<typeof prisma.task.update>[0]['data'],
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Record status change in history
    if (newStatus !== oldStatus) {
      const now = new Date();
      const timeInPreviousColumn = task.timeInColumns as Record<string, number> || {};
      const previousTime = timeInPreviousColumn[oldStatus] || 0;
      const duration = Math.floor((now.getTime() - task.createdAt.getTime()) / 1000);

      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          fromColumn: oldStatus,
          toColumn: newStatus,
          timestamp: now,
          duration: duration - previousTime,
        },
      });

      // Update time in columns
      const updatedTimeInColumns = { ...timeInPreviousColumn };
      if (oldStatus) {
        updatedTimeInColumns[oldStatus] = (updatedTimeInColumns[oldStatus] || 0) + (duration - previousTime);
      }

      await prisma.task.update({
        where: { id: taskId },
        data: {
          timeInColumns: updatedTimeInColumns,
        },
      });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await auth();
    const { taskId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { board: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    // Verify user has access to board
    const hasAccess = await userHasBoardAccess(session.user.id, task.boardId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    // Audit log
    await writeAuditLog({
      entityType: 'task',
      entityId: taskId,
      action: 'delete',
      userId: session.user.id,
      metadata: { boardId: task.boardId, title: task.title },
    });

    return NextResponse.json({ message: 'Tarea eliminada' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}
