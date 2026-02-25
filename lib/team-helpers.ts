import { prisma } from '@/lib/db';

/**
 * Ensures a user has access to all public teams by adding them to public teams
 * if they're not already a member.
 */
export async function ensureUserHasPublicTeamAccess(userId: string): Promise<void> {
  try {
    // Find all public teams
    const publicTeams = await prisma.team.findMany({
      where: {
        isPublic: true,
      },
    });

    // Add user to all public teams if not already a member
    for (const team of publicTeams) {
      const existingMembership = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId: team.id,
          },
        },
      });

      if (!existingMembership) {
        await prisma.userTeam.create({
          data: {
            userId,
            teamId: team.id,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error ensuring user has public team access:', error);
    throw error;
  }
}

/**
 * Gets or creates a public team for admin boards.
 * If no public team exists, creates one named "Public".
 */
export async function getOrCreatePublicTeam(): Promise<string> {
  try {
    let publicTeam = await prisma.team.findFirst({
      where: {
        isPublic: true,
      },
    });

    if (!publicTeam) {
      publicTeam = await prisma.team.create({
        data: {
          name: 'Public',
          isPublic: true,
        },
      });
    }

    return publicTeam.id;
  } catch (error) {
    console.error('Error getting or creating public team:', error);
    throw error;
  }
}

/**
 * Checks if a user has access to a board (either owns it or is member of team).
 */
export async function userHasBoardAccess(userId: string, boardId: string): Promise<boolean> {
  try {
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [
          { userId }, // User owns the board
          {
            teamId: { not: null },
            team: {
              members: {
                some: { userId },
              },
            },
          }, // User is member of team that owns the board
        ],
      },
    });

    return !!board;
  } catch (error) {
    console.error('Error checking board access:', error);
    return false;
  }
}
