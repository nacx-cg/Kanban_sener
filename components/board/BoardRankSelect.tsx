'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

interface BoardRankSelectProps {
  boardId: string;
  boardName: string;
  currentPosition: number;
  totalBoards: number;
  onReordered?: () => void;
}

export function BoardRankSelect({
  boardId,
  boardName,
  currentPosition,
  totalBoards,
  onReordered,
}: BoardRankSelectProps) {
  const [loading, setLoading] = useState(false);

  const handleChange = async (value: string) => {
    const newPos = parseInt(value, 10);
    if (newPos === currentPosition || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/boards/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, position: newPos }),
      });
      if (res.ok && onReordered) onReordered();
    } catch (err) {
      console.error('Error reordering:', err);
    } finally {
      setLoading(false);
    }
  };

  if (totalBoards <= 1) return null;

  return (
    <Select
      value={String(currentPosition)}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger
        className="h-8 w-14 text-xs"
        title={`Mover "${boardName}" a posición`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: totalBoards }, (_, i) => i + 1).map((n) => (
          <SelectItem key={n} value={String(n)}>
            {n}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
