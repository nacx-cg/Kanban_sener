import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdminUser } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Solo administradores pueden ver todas las tareas' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');
    const assigneeId = searchParams.get('assigneeId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (boardId) where.boardId = boardId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (status) where.status = status;

    const tasks = await prisma.task.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching all tasks:', error);
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    );
  }
}
