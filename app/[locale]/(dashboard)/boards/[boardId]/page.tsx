import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { KanbanBoard } from '@/components/board/KanbanBoard';
import { isAdmin } from '@/lib/auth-helpers';
import { userHasBoardAccess } from '@/lib/team-helpers';
import { Badge } from '@/components/ui/badge';
import { getTranslations } from 'next-intl/server';
import { BoardActions } from '@/components/board/BoardActions';

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const session = await auth();
  const { boardId } = await params;
  const t = await getTranslations('board');

  if (!session?.user) {
    redirect('/es/login');
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      tasks: {
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
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

  if (!board) {
    redirect('/es/dashboard');
  }

  // Check if user has access to board (owner or team member)
  const hasAccess = await userHasBoardAccess(session.user.id, boardId);
  if (!hasAccess) {
    redirect('/es/dashboard');
  }

  const userIsAdmin = isAdmin(session.user.email);
  const isTeamShared = board.teamId !== null;
  const isOwner = board.userId === session.user.id;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{board.name}</h1>
            {userIsAdmin && isTeamShared && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {t('shared')} {board.team?.name && `- ${board.team.name}`}
              </Badge>
            )}
          </div>
          <BoardActions board={board} isOwner={isOwner} isAdmin={userIsAdmin} />
        </div>
        {board.description && (
          <p className="text-muted-foreground mt-2">{board.description}</p>
        )}
        {board.user && (
          <p className="text-sm text-muted-foreground mt-1">
            {t('createdBy')}: {board.user.name || board.user.email}
          </p>
        )}
      </div>
      <KanbanBoard
        board={
          {
            ...board,
            columns: Array.isArray(board.columns)
              ? (board.columns as string[])
              : ['todo', 'inProgress', 'review', 'done'],
          } as Parameters<typeof KanbanBoard>[0]['board']
        }
      />
    </div>
  );
}
