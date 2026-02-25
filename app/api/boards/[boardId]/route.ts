import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { userHasBoardAccess } from '@/lib/team-helpers';
import { z } from 'zod';
import { getOrCreatePublicTeam } from '@/lib/team-helpers';
import { isAdmin } from '@/lib/auth-helpers';
import { writeAuditLog } from '@/lib/audit';

const updateBoardSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  columns: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const session = await auth();
    const { boardId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [
          { userId: session.user.id }, // User owns the board
          {
            teamId: { not: null },
            team: {
              members: {
                some: { userId: session.user.id },
              },
            },
          }, // User is member of team that owns the board
        ],
      },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
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
      },
    });

    if (!board) {
      return NextResponse.json({ error: 'Tablero no encontrado' }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error('Error fetching board:', error);
    return NextResponse.json(
      { error: 'Error al obtener tablero' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const session = await auth();
    const { boardId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Check if user has access to board
    const hasAccess = await userHasBoardAccess(session.user.id, boardId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      return NextResponse.json({ error: 'Tablero no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const data = updateBoardSchema.parse(body);

    let nextTeamId = board.teamId;
    // Handle privacy toggle:
    // - Owner can toggle their own board
    // - Admin can toggle any board
    if (data.isPublic !== undefined) {
      const userIsAdmin = isAdmin(session.user.email);
      const isOwner = board.userId === session.user.id;
      if (!isOwner && !userIsAdmin) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      if (data.isPublic) {
        const publicTeamId = await getOrCreatePublicTeam();
        nextTeamId = publicTeamId;
      } else {
        nextTeamId = null;
      }
    }

    // Remove isPublic from data since it's not a Board field (it's on Team)
    const { isPublic, ...boardUpdateData } = data;

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: {
        ...boardUpdateData,
        teamId: nextTeamId !== undefined ? nextTeamId : board.teamId,
        description: data.description !== undefined ? data.description : board.description,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            isPublic: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (data.isPublic !== undefined) {
      await writeAuditLog({
        entityType: 'board',
        entityId: boardId,
        action: 'privacy_change',
        userId: session.user.id,
        metadata: { isPublic: data.isPublic },
      });
    }

    return NextResponse.json(updatedBoard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating board:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tablero' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const session = await auth();
    const { boardId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      return NextResponse.json({ error: 'Tablero no encontrado' }, { status: 404 });
    }

    // Board owner can delete; admin can also delete any board
    const userIsAdmin = isAdmin(session.user.email);
    if (board.userId !== session.user.id && !userIsAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await prisma.board.delete({
      where: { id: boardId },
    });

    await writeAuditLog({
      entityType: 'board',
      entityId: boardId,
      action: 'delete',
      userId: session.user.id,
      metadata: { name: board.name, ownerId: board.userId },
    });

    return NextResponse.json({ message: 'Tablero eliminado' });
  } catch (error) {
    console.error('Error deleting board:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tablero' },
      { status: 500 }
    );
  }
}
