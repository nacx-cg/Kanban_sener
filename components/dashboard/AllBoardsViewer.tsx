'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, FileText, Users, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Board {
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

interface AllBoardsViewerProps {
  boards?: Board[]; // Optional: boards passed from parent (if not provided, fetches them)
  allBoards?: boolean; // If true, shows all users' boards (admin view)
}

export function AllBoardsViewer({ boards: propBoards, allBoards = false }: AllBoardsViewerProps) {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>(propBoards || []);
  const [loading, setLoading] = useState(!propBoards);

  useEffect(() => {
    if (propBoards) {
      setBoards(propBoards);
      setLoading(false);
    } else {
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
        
        // Sort by last update (most recently updated first)
        data.sort((a: Board, b: Board) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        
        setBoards(data);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBoardStatus = (board: Board) => {
    const tasks = board.tasks || [];
    const totalTasks = tasks.length || board._count?.tasks || 0;
    const completedTasks = tasks.filter(t => t.status === 'done' && t.completedAt).length;
    
    if (totalTasks === 0) return { label: 'Vacío', variant: 'outline' as const, color: 'text-gray-500' };
    if (completedTasks === totalTasks) return { label: 'Completado', variant: 'default' as const, color: 'text-green-600' };
    if (completedTasks > 0) return { label: 'En Progreso', variant: 'secondary' as const, color: 'text-blue-600' };
    return { label: 'Activo', variant: 'default' as const, color: 'text-indigo-600' };
  };

  const getTasksByStatus = (board: Board) => {
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
          <p className="text-muted-foreground">Cargando tableros...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{boards.length} tableros</Badge>
          <Button onClick={() => router.push('/es/boards/new')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Tablero
          </Button>
        </div>
      </div>

      {boards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {allBoards ? 'No hay tableros en el sistema.' : 'No tienes tableros aún.'}
            </p>
            {!allBoards && (
              <Button onClick={() => router.push('/es/boards/new')}>
                Crear tu primer tablero
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
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
                          <CardDescription className="line-clamp-2 mt-1">
                            {board.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Task count */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{totalTasks}</span>
                          <span className="text-muted-foreground">tareas</span>
                        </div>
                      </div>

                      {/* Status breakdown - only show if there are tasks */}
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

                      {totalTasks === 0 && (
                        <div className="text-center py-2 text-sm text-muted-foreground bg-gray-50 rounded">
                          Sin tareas
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
      )}
    </div>
  );
}

