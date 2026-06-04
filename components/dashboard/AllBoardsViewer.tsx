'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BoardsListView, type BoardListItem } from '@/components/dashboard/BoardsListView';
import { Plus } from 'lucide-react';

interface AllBoardsViewerProps {
  boards?: BoardListItem[];
  allBoards?: boolean;
  onReordered?: () => void;
  showRanking?: boolean;
}

export function AllBoardsViewer({
  boards: propBoards,
  allBoards = false,
  onReordered,
  showRanking = true,
}: AllBoardsViewerProps) {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : 'es';
  const [boards, setBoards] = useState<BoardListItem[]>(propBoards || []);
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
        const merged = [...(data.publicBoards || []), ...(data.privateBoards || [])];
        setBoards(Array.isArray(data) ? data : merged);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{boards.length} tableros</Badge>
          <Button onClick={() => router.push(`/${locale}/boards/new`)} size="sm">
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
              <Button onClick={() => router.push(`/${locale}/boards/new`)}>
                Crear tu primer tablero
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <BoardsListView
          boards={boards}
          onReordered={onReordered ?? fetchBoards}
          showRanking={showRanking}
          showStatus
          showTeam
        />
      )}
    </div>
  );
}
