import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/auth-helpers';
import { getOrCreatePublicTeam, ensureUserHasPublicTeamAccess } from '@/lib/team-helpers';
import { z } from 'zod';
import { writeAuditLog } from '@/lib/audit';

const createBoardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  teamId: z.string().optional(),
  columns: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Ensure public team exists and user has access to it
    try {
      // Get or create public team first
      let publicTeam = await prisma.team.findFirst({
        where: { isPublic: true },
      });

      if (!publicTeam) {
        publicTeam = await prisma.team.create({
          data: {
            name: 'Public',
            isPublic: true,
          },
        });
      }

      // Now ensure user has access to public team (will create membership if needed)
      await ensureUserHasPublicTeamAccess(session.user.id);
    } catch (error) {
      console.error('Error ensuring public team access:', error);
      // Continue even if this fails
    }

    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { userId: session.user.id }, // User owns the board (including private ones with teamId: null)
          {
            teamId: { not: null }, // Only boards with a team (public/shared boards)
            team: {
              members: {
                some: { userId: session.user.id },
              },
            },
          }, // User is member of team that owns the board
        ],
      },
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
    console.error('Error fetching boards:', error);
    return NextResponse.json(
      { error: 'Error al obtener tableros' },
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
    const { name, description, teamId, columns } = createBoardSchema.parse(body);

    // Check if user is admin
    const userIsAdmin = isAdmin(session.user.email);
    let finalTeamId: string | null = teamId || null;

    // If admin, assign board to public team
    if (userIsAdmin && !teamId) {
      finalTeamId = await getOrCreatePublicTeam();
    }

    const board = await prisma.board.create({
      data: {
        name,
        description: description || null,
        userId: session.user.id,
        teamId: finalTeamId,
        columns: columns || ['todo', 'inProgress', 'review', 'done'],
      },
      include: {
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

    await writeAuditLog({
      entityType: 'board',
      entityId: board.id,
      action: 'create',
      userId: session.user.id,
      metadata: { name },
    });

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating board:', error);
    return NextResponse.json(
      { error: 'Error al crear tablero' },
      { status: 500 }
    );
  }
}
