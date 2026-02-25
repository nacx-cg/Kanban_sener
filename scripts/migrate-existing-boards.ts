/**
 * Migration script to assign existing admin-created boards to public teams
 * Run this once after deploying the team feature: npx tsx scripts/migrate-existing-boards.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExistingBoards() {
  try {
    console.log('Starting migration of existing admin boards...');

    // Get admin emails from environment
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    
    if (adminEmails.length === 0) {
      console.log('No ADMIN_EMAILS found in environment. Skipping migration.');
      return;
    }

    console.log(`Found ${adminEmails.length} admin emails:`, adminEmails);

    // Get or create public team
    let publicTeam = await prisma.team.findFirst({
      where: { isPublic: true },
    });

    if (!publicTeam) {
      console.log('Creating public team...');
      publicTeam = await prisma.team.create({
        data: {
          name: 'Public',
          isPublic: true,
        },
      });
      console.log(`Public team created: ${publicTeam.id}`);
    } else {
      console.log(`Public team found: ${publicTeam.id}`);
    }

    // Find all admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        email: {
          in: adminEmails,
        },
      },
    });

    console.log(`Found ${adminUsers.length} admin users`);

    // Find all boards created by admins that don't have a teamId
    const adminBoardIds = adminUsers.map(u => u.id);
    const boardsToMigrate = await prisma.board.findMany({
      where: {
        userId: {
          in: adminBoardIds,
        },
        teamId: null,
      },
    });

    console.log(`Found ${boardsToMigrate.length} admin boards without team assignment`);

    // Assign them to public team
    if (boardsToMigrate.length > 0) {
      const result = await prisma.board.updateMany({
        where: {
          id: {
            in: boardsToMigrate.map(b => b.id),
          },
        },
        data: {
          teamId: publicTeam.id,
        },
      });

      console.log(`Migrated ${result.count} boards to public team`);
    }

    // Add all users to public team
    const allUsers = await prisma.user.findMany({
      select: { id: true },
    });

    console.log(`Adding ${allUsers.length} users to public team...`);

    let addedCount = 0;
    for (const user of allUsers) {
      const existing = await prisma.userTeam.findUnique({
        where: {
          userId_teamId: {
            userId: user.id,
            teamId: publicTeam.id,
          },
        },
      });

      if (!existing) {
        await prisma.userTeam.create({
          data: {
            userId: user.id,
            teamId: publicTeam.id,
          },
        });
        addedCount++;
      }
    }

    console.log(`Added ${addedCount} users to public team (${allUsers.length - addedCount} already had access)`);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateExistingBoards();

