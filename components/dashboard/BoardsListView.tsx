'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BoardRankSelect } from '@/components/board/BoardRankSelect';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalLink } from 'lucide-react';

interface BoardTask {
  status: string;
  completedAt: Date | string | null;
}

export interface BoardListItem {
  id: string;
  name: string;
  description: string | null;
  teamId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  team?: {
    id: string;
    name: string;
    isPublic?: boolean;
  } | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  tasks?: BoardTask[];
  _count: {
    tasks: number;
  };
}

interface BoardsListViewProps {
  boards: BoardListItem[];
  isAdmin?: boolean;
  onReordered?: () => void;
  showRanking?: boolean;
  showStatus?: boolean;
  showTeam?: boolean;
  /** When set, rank position is computed against this list (e.g. all boards while displaying active-only). */
  rankingBoards?: BoardListItem[];
}

function getBoardStatus(board: BoardListItem) {
  const tasks = board.tasks || [];
  const totalTasks = tasks.length || board._count?.tasks || 0;
  const completedTasks = tasks.filter((t) => t.status === 'done' && t.completedAt).length;

  if (totalTasks === 0) return { label: 'Vacío', variant: 'outline' as const };
  if (completedTasks === totalTasks) return { label: 'Completado', variant: 'default' as const };
  if (completedTasks > 0) return { label: 'En Progreso', variant: 'secondary' as const };
  return { label: 'Activo', variant: 'default' as const };
}

function getTaskBreakdown(board: BoardListItem) {
  const tasks = board.tasks || [];
  return {
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'inProgress').length,
    review: tasks.filter((t) => t.status === 'review').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };
}

function TaskBreakdownBadges({ board }: { board: BoardListItem }) {
  const totalTasks = board._count?.tasks ?? board.tasks?.length ?? 0;
  const breakdown = getTaskBreakdown(board);

  if (totalTasks === 0) {
    return (
      <span className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
        Sin tareas
      </span>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-1.5 min-w-[280px]">
      <div className="text-center p-1.5 bg-blue-50 rounded">
        <div className="font-semibold text-blue-700 text-xs">{breakdown.todo}</div>
        <div className="text-blue-600 text-[10px] leading-tight">Por Hacer</div>
      </div>
      <div className="text-center p-1.5 bg-yellow-50 rounded">
        <div className="font-semibold text-yellow-700 text-xs">{breakdown.inProgress}</div>
        <div className="text-yellow-600 text-[10px] leading-tight">En Progreso</div>
      </div>
      <div className="text-center p-1.5 bg-purple-50 rounded">
        <div className="font-semibold text-purple-700 text-xs">{breakdown.review}</div>
        <div className="text-purple-600 text-[10px] leading-tight">Revisión</div>
      </div>
      <div className="text-center p-1.5 bg-green-50 rounded">
        <div className="font-semibold text-green-700 text-xs">{breakdown.done}</div>
        <div className="text-green-600 text-[10px] leading-tight">Completado</div>
      </div>
    </div>
  );
}

export function BoardsListView({
  boards,
  isAdmin = false,
  onReordered,
  showRanking = true,
  showStatus = false,
  showTeam = false,
  rankingBoards,
}: BoardsListViewProps) {
  const params = useParams<{ locale: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : 'es';
  const rankList = rankingBoards ?? boards;

  if (boards.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay tableros.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                {showRanking && (
                  <th className="text-left py-3 px-4 font-medium w-16">#</th>
                )}
                <th className="text-left py-3 px-4 font-medium">Nombre</th>
                {showStatus && (
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                )}
                <th className="text-left py-3 px-4 font-medium min-w-[160px]">Descripción</th>
                <th className="text-left py-3 px-4 font-medium">Tareas</th>
                {showStatus && (
                  <th className="text-left py-3 px-4 font-medium min-w-[300px]">Progreso</th>
                )}
                {showTeam && (
                  <th className="text-left py-3 px-4 font-medium">Equipo</th>
                )}
                <th className="text-left py-3 px-4 font-medium">Creado por</th>
                <th className="text-left py-3 px-4 font-medium whitespace-nowrap">Actualizado</th>
                <th className="text-left py-3 px-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((board) => {
                const rankPosition = rankList.findIndex((b) => b.id === board.id) + 1;
                const status = getBoardStatus(board);
                const totalTasks = board._count?.tasks ?? board.tasks?.length ?? 0;

                return (
                  <tr key={board.id} className="border-b hover:bg-muted/50">
                    {showRanking && (
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <BoardRankSelect
                          boardId={board.id}
                          boardName={board.name}
                          currentPosition={rankPosition}
                          totalBoards={rankList.length}
                          onReordered={onReordered}
                        />
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{board.name}</span>
                        {isAdmin && board.teamId && (
                          <Badge variant="outline" className="text-xs">
                            Compartido
                          </Badge>
                        )}
                      </div>
                    </td>
                    {showStatus && (
                      <td className="py-3 px-4">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                    )}
                    <td className="py-3 px-4 text-muted-foreground max-w-[220px] truncate">
                      {board.description || '—'}
                    </td>
                    <td className="py-3 px-4 tabular-nums">{totalTasks}</td>
                    {showStatus && (
                      <td className="py-3 px-4">
                        <TaskBreakdownBadges board={board} />
                      </td>
                    )}
                    {showTeam && (
                      <td className="py-3 px-4">
                        {board.team ? (
                          <Badge variant={board.team.isPublic ? 'default' : 'secondary'} className="text-xs">
                            {board.team.name}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                    <td className="py-3 px-4 text-muted-foreground">
                      {board.user?.name || board.user?.email || '—'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {board.updatedAt
                        ? format(new Date(board.updatedAt), 'dd/MM/yyyy', { locale: es })
                        : board.createdAt
                          ? format(new Date(board.createdAt), 'dd/MM/yyyy', { locale: es })
                          : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/${locale}/boards/${board.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Abrir
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
