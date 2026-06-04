import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const reorderSchema = z.object({
  boardId: z.string(),
  position: z.number().int().min(1),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { boardId, position } = reorderSchema.parse(body);

    const [boards, orders] = await Promise.all([
      prisma.board.findMany({
        where: {
          teamId: { not: null },
          team: {
            members: {
              some: { userId: session.user.id },
            },
          },
        },
        select: { id: true, updatedAt: true },
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
    const boardIds = sorted.map((b) => b.id);
    if (!boardIds.includes(boardId)) {
      return NextResponse.json(
        { error: 'No tienes acceso a este tablero' },
        { status: 403 }
      );
    }

    if (position < 1 || position > boardIds.length) {
      return NextResponse.json(
        { error: `La posición debe estar entre 1 y ${boardIds.length}` },
        { status: 400 }
      );
    }

    const ordered = [...boardIds];

    const fromIdx = ordered.indexOf(boardId);
    if (fromIdx === -1) return NextResponse.json({ ok: true });
    const toIdx = position - 1;
    if (fromIdx === toIdx) return NextResponse.json({ ok: true });

    ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, boardId);

    await prisma.$transaction(
      ordered.map((bid, i) =>
        prisma.boardOrder.upsert({
          where: {
            userId_boardId: { userId: session.user!.id!, boardId: bid },
          },
          create: {
            userId: session.user!.id!,
            boardId: bid,
            position: i + 1,
          },
          update: { position: i + 1 },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error reordering boards:', error);
    return NextResponse.json(
      { error: 'Error al reordenar tableros' },
      { status: 500 }
    );
  }
}
