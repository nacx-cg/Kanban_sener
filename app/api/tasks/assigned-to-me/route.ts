import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { userHasBoardAccess } from '@/lib/team-helpers';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      where: { assigneeId: session.user.id },
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
        board: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    // Filter to only tasks from boards the user has access to
    const accessibleTasks = [];
    for (const task of tasks) {
      const hasAccess = await userHasBoardAccess(session.user.id, task.boardId);
      if (hasAccess) {
        accessibleTasks.push(task);
      }
    }

    return NextResponse.json(accessibleTasks);
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    return NextResponse.json(
      { error: 'Error al obtener tareas asignadas' },
      { status: 500 }
    );
  }
}
