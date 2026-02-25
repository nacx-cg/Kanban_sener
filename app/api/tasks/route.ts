import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { userHasBoardAccess } from '@/lib/team-helpers';
import { isAdmin } from '@/lib/auth-helpers';
import { z } from 'zod';
import { writeAuditLog } from '@/lib/audit';

const createTaskSchema = z.object({
  boardId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  workType: z.enum(['feature', 'bug', 'task', 'research']).default('task'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['todo', 'inProgress', 'review', 'done']).default('todo'),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json(
        { error: 'boardId es requerido' },
        { status: 400 }
      );
    }

    // Verify user has access to board
    const hasAccess = await userHasBoardAccess(session.user.id, boardId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      where: { boardId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTaskSchema.parse(body);

    // Verify user has access to board
    const hasAccess = await userHasBoardAccess(session.user.id, data.boardId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Get board to check if it's team-shared
    const board = await prisma.board.findUnique({
      where: { id: data.boardId },
      select: { teamId: true },
    });

    // Check if user is admin
    const userIsAdmin = isAdmin(session.user.email);

    // Validate assignee for team-shared boards
    let finalAssigneeId = data.assigneeId;
    if (board?.teamId && !userIsAdmin) {
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

    const taskData = {
      boardId: data.boardId,
      title: data.title,
      description: data.description,
      workType: data.workType,
      priority: data.priority,
      status: data.status,
      createdById: session.user.id,
      assigneeId: finalAssigneeId || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      tags: data.tags || [],
      timeInColumns: {},
    };
    const task = await prisma.task.create({
      data: taskData,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Record task creation in history
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        fromColumn: null,
        toColumn: task.status,
        timestamp: new Date(),
      },
    });

    // Audit log
    await writeAuditLog({
      entityType: 'task',
      entityId: task.id,
      action: 'create',
      userId: session.user.id,
      metadata: { boardId: data.boardId, title: data.title },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    );
  }
}
