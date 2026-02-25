'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, Calendar, FileText, Users } from 'lucide-react';

interface ActiveBoard {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    tasks: number;
  };
  user?: {
    name: string | null;
    email: string;
  };
  team?: {
    id: string;
    name: string;
    isPublic: boolean;
  } | null;
  tasks?: Array<{
    id: string;
    status: string;
    completedAt: Date | null;
  }>;
}

interface ActiveBoardsViewerProps {
  boards?: ActiveBoard[]; // Pass boards as prop to avoid duplicate fetching
  allBoards?: boolean; // If true, shows all users' boards (admin view)
}

export function ActiveBoardsViewer({ boards: propBoards, allBoards = false }: ActiveBoardsViewerProps) {
  const [boards, setBoards] = useState<ActiveBoard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propBoards) {
      // If boards are passed as prop, use them directly
      const activeBoards = propBoards.filter((board: ActiveBoard) => {
        const taskCount = board._count?.tasks || board.tasks?.length || 0;
        return taskCount > 0;
      });
      
      // Sort by last update (most recently active first)
      activeBoards.sort((a: ActiveBoard, b: ActiveBoard) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      setBoards(activeBoards);
      setLoading(false);
    } else {
      // Otherwise, fetch boards
      fetchBoards();
    }
  }, [propBoards, allBoards]);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const endpoint = allBoards ? '/api/boards/all' : '/api/boards';
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        // Filter to show only boards with tasks (active boards)
        const activeBoards = data.filter((board: ActiveBoard) => {
          const taskCount = board._count?.tasks || board.tasks?.length || 0;
          return taskCount > 0;
        });
        
        // Sort by last update (most recently active first)
        activeBoards.sort((a: ActiveBoard, b: ActiveBoard) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        
        setBoards(activeBoards);
      }
    } catch (error) {
      console.error('Error fetching active boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBoardStatus = (board: ActiveBoard) => {
    const tasks = board.tasks || [];
    const completedTasks = tasks.filter(t => t.status === 'done' && t.completedAt).length;
    const totalTasks = tasks.length || board._count?.tasks || 0;
    
    if (totalTasks === 0) return { label: 'Vacío', variant: 'outline' as const };
    if (completedTasks === totalTasks) return { label: 'Completado', variant: 'default' as const };
    if (completedTasks > 0) return { label: 'En Progreso', variant: 'secondary' as const };
    return { label: 'Activo', variant: 'default' as const };
  };

  const getTasksByStatus = (board: ActiveBoard) => {
    const tasks = board.tasks || [];
    return {
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'inProgress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando tableros activos...</p>
        </CardContent>
      </Card>
    );
  }

  if (boards.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">
            No hay tableros activos en este momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end mb-4">
        <Badge variant="secondary">{boards.length} tableros</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.map((board) => {
          const status = getBoardStatus(board);
          const tasksByStatus = getTasksByStatus(board);
          const totalTasks = board._count?.tasks || board.tasks?.length || 0;

          return (
            <Link key={board.id} href={`/es/boards/${board.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{board.name}</CardTitle>
                      {board.description && (
                        <CardDescription className="line-clamp-2">
                          {board.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Task counts by status */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{totalTasks}</span>
                        <span className="text-muted-foreground">tareas</span>
                      </div>
                    </div>

                    {/* Status breakdown */}
                    {totalTasks > 0 && (
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="font-semibold text-blue-700">{tasksByStatus.todo}</div>
                          <div className="text-blue-600">Por Hacer</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded">
                          <div className="font-semibold text-yellow-700">{tasksByStatus.inProgress}</div>
                          <div className="text-yellow-600">En Progreso</div>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <div className="font-semibold text-purple-700">{tasksByStatus.review}</div>
                          <div className="text-purple-600">Revisión</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-semibold text-green-700">{tasksByStatus.done}</div>
                          <div className="text-green-600">Completado</div>
                        </div>
                      </div>
                    )}

                    {/* Board metadata */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Actualizado {format(new Date(board.updatedAt), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        </div>
                      </div>
                      {(allBoards || board.team) && (
                        <div className="flex items-center gap-2 text-xs">
                          {board.team && (
                            <Badge variant={board.team.isPublic ? 'default' : 'secondary'} className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {board.team.name}
                            </Badge>
                          )}
                          {allBoards && board.user && (
                            <span className="text-muted-foreground truncate">
                              Por: {board.user.name || board.user.email}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

