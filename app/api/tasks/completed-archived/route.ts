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

    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          {
            teamId: { not: null },
            team: {
              members: {
                some: { userId: session.user.id },
              },
            },
          },
        ],
      },
      select: { id: true },
    });
    const boardIds = boards.map((b) => b.id);

    const tasks = await prisma.task.findMany({
      where: {
        boardId: { in: boardIds },
        status: { in: ['done', 'archivo'] },
      },
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
      orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching completed/archived tasks:', error);
    return NextResponse.json(
      { error: 'Error al obtener tareas completadas y archivadas' },
      { status: 500 }
    );
  }
}
