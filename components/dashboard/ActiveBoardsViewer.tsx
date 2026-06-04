'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BoardsListView, type BoardListItem } from '@/components/dashboard/BoardsListView';

type ActiveBoard = BoardListItem & { userId?: string };

interface ActiveBoardsViewerProps {
  boards?: ActiveBoard[];
  allBoards?: boolean;
  onReordered?: () => void;
  showRanking?: boolean;
}

export function ActiveBoardsViewer({
  boards: propBoards,
  allBoards = false,
  onReordered,
  showRanking = true,
}: ActiveBoardsViewerProps) {
  const [fullBoards, setFullBoards] = useState<ActiveBoard[]>([]);
  const [boards, setBoards] = useState<ActiveBoard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propBoards) {
      setFullBoards(propBoards);
      const activeBoards = propBoards.filter((board: ActiveBoard) => {
        const taskCount = board._count?.tasks || board.tasks?.length || 0;
        return taskCount > 0;
      });
      setBoards(activeBoards);
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
        const all = Array.isArray(data) ? data : merged;
        setFullBoards(all);
        const activeBoards = all.filter((board: ActiveBoard) => {
          const taskCount = board._count?.tasks || board.tasks?.length || 0;
          return taskCount > 0;
        });
        setBoards(activeBoards);
      }
    } catch (error) {
      console.error('Error fetching active boards:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-end">
        <Badge variant="secondary">{boards.length} tableros</Badge>
      </div>
      <BoardsListView
        boards={boards}
        onReordered={onReordered ?? (() => fetchBoards())}
        showRanking={showRanking}
        showStatus
        showTeam
        rankingBoards={fullBoards}
      />
    </div>
  );
}
