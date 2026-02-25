'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Board {
  id: string;
  name: string;
  description: string | null;
  teamId: string | null;
  team?: {
    id: string;
    name: string;
  } | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  _count: {
    tasks: number;
  };
}

export function DashboardContent() {
  const t = useTranslations('dashboard');
  const tBoard = useTranslations('board');
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchBoards();
    fetchAdminStatus();
  }, []);

  const fetchAdminStatus = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin || false);
      }
    } catch (error) {
      // Silently fail
    }
  };

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/boards');
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Mis Tableros</h2>
        <Link href="/es/boards/new">
          <Button>Crear Tablero</Button>
        </Link>
      </div>

      {boards.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              No tienes tableros aún. Crea uno para comenzar.
            </p>
            <Link href="/es/boards/new">
              <Button>Crear Primer Tablero</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Link key={board.id} href={`/es/boards/${board.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex-1">{board.name}</CardTitle>
                    {isAdmin && board.teamId && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                        {tBoard('shared')}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {board.description || 'Sin descripción'}
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      {board._count.tasks} {board._count.tasks === 1 ? 'tarea' : 'tareas'}
                    </p>
                    {board.user && (
                      <p className="text-xs text-muted-foreground">
                        {tBoard('createdBy')}: {board.user.name || board.user.email}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

