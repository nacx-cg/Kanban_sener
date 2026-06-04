import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdminUser } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Only admins can view all boards
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Solo administradores pueden ver todos los tableros' },
        { status: 403 }
      );
    }

    const [boards, orders] = await Promise.all([
      prisma.board.findMany({
        include: {
          _count: { select: { tasks: true } },
          user: { select: { id: true, name: true, email: true } },
          team: { select: { id: true, name: true, isPublic: true } },
          tasks: { select: { id: true, status: true, completedAt: true } },
        },
      }),
      prisma.boardOrder.findMany({
        where: { userId: session.user.id },
        select: { boardId: true, position: true },
      }),
    ]);

    const orderMap = new Map(orders.map((o) => [o.boardId, o.position]));
    const sorted = boards.sort((a, b) => {
      const posA = orderMap.get(a.id) ?? 999999;
      const posB = orderMap.get(b.id) ?? 999999;
      if (posA !== posB) return posA - posB;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json(sorted);
  } catch (error) {
    console.error('Error fetching all boards:', error);
    return NextResponse.json(
      { error: 'Error al obtener tableros' },
      { status: 500 }
    );
  }
}

