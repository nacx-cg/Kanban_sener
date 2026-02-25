import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Only admins can view all boards
    if (!isAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Solo administradores pueden ver todos los tableros' },
        { status: 403 }
      );
    }

    const boards = await prisma.board.findMany({
      include: {
        _count: {
          select: { tasks: true },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            isPublic: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error('Error fetching all boards:', error);
    return NextResponse.json(
      { error: 'Error al obtener tableros' },
      { status: 500 }
    );
  }
}

