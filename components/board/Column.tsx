'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from '../task/TaskCard';
import type { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface ColumnProps {
  id: string;
  title: string;
  boardId: string;
  boardIsShared?: boolean;
  boardOwnerId?: string;
  isAdmin?: boolean;
  canArchive?: boolean;
  tasks: (Task & {
    assignee: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  })[];
  onTaskCreated?: () => void;
  onTaskDeleted?: () => void;
  onTaskUpdated?: () => void;
  isOver?: boolean;
}

export function Column({ id, title, boardId, boardIsShared = false, boardOwnerId, isAdmin = false, canArchive = false, tasks, onTaskDeleted, onTaskUpdated, isOver = false }: ColumnProps) {
  const t = useTranslations('task');
  const { setNodeRef } = useDroppable({
    id,
  });

  const taskIds = tasks.map((task) => task.id);

  return (
    <Card
      ref={setNodeRef}
      className={`flex flex-col h-full min-h-[500px] min-w-0 ${
        isOver ? 'border-primary border-2' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
            {tasks.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 min-w-0">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} boardOwnerId={boardOwnerId} isAdmin={isAdmin} canArchive={canArchive} boardIsShared={boardIsShared} onDeleted={onTaskDeleted} onTaskUpdated={onTaskUpdated} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            No hay tareas
          </div>
        )}
      </CardContent>
    </Card>
  );
}

