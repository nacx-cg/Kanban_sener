'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Column } from './Column';
import { TaskCard } from '../task/TaskCard';
import { Button } from '@/components/ui/button';
import { CreateTaskForm } from '../task/CreateTaskForm';
import type { Board, Task } from '@/types';
import { useEffect as useClientEffect, useState as useClientState } from 'react';

interface KanbanBoardProps {
  board: Board & {
    tasks: (Task & {
      assignee: {
        id: string;
        name: string | null;
        email: string;
      } | null;
    })[];
  };
}

export function KanbanBoard({ board }: KanbanBoardProps) {
  const [tasks, setTasks] = useState(board.tasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const columns = (board.columns as string[]) || ['todo', 'inProgress', 'review', 'done'];
  const [isAdmin, setIsAdmin] = useClientState(false);
  const [openCreate, setOpenCreate] = useClientState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setTasks(board.tasks);
  }, [board.tasks]);

  useClientEffect(() => {
    fetch('/api/users/me')
      .then((r) => r.json())
      .then((data) => setIsAdmin(!!data.isAdmin))
      .catch(() => {});
  }, []);

  const refreshTasks = useCallback(async () => {
    try {
      const response = await fetch(`/api/tasks?boardId=${board.id}`);
      if (response.ok) {
        const updatedTasks = await response.json();
        setTasks(updatedTasks);
      }
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    }
  }, [board.id]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the task being dragged
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Check if dropping on a column
    const targetColumn = columns.find((col) => col === overId);
    if (targetColumn && targetColumn !== activeTask.status) {
      // Update task status
      try {
        const response = await fetch(`/api/tasks/${activeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: targetColumn }),
        });

        if (response.ok) {
          const updatedTask = await response.json();
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task.id === activeId ? updatedTask : task
            )
          );
        }
      } catch (error) {
        console.error('Error updating task:', error);
      }
      return;
    }

    // Handle reordering within the same column
    const activeIndex = tasks.findIndex((t) => t.id === activeId);
    const overIndex = tasks.findIndex((t) => t.id === overId);

    if (activeIndex !== overIndex) {
      setTasks((items) => arrayMove(items, activeIndex, overIndex));
    }
  };

  const getTasksByColumn = (columnId: string) => {
    return tasks.filter((task) => task.status === columnId);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex justify-end mb-4">
        <Button onClick={() => setOpenCreate(true)}>Crear Tarea</Button>
      </div>
      <CreateTaskForm
        boardId={board.id}
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSuccess={refreshTasks}
        isAdmin={isAdmin}
        boardIsShared={board.teamId !== null}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((columnId) => (
          <Column
            key={columnId}
            id={columnId}
            title={getColumnTitle(columnId)}
            boardId={board.id}
            boardIsShared={board.teamId !== null}
            boardOwnerId={board.userId}
            isAdmin={isAdmin}
            tasks={getTasksByColumn(columnId)}
            onTaskCreated={refreshTasks}
            onTaskDeleted={refreshTasks}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80">
            <TaskCard task={activeTask} boardOwnerId={board.userId} isAdmin={isAdmin} onDeleted={refreshTasks} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function getColumnTitle(columnId: string): string {
  const titles: Record<string, string> = {
    todo: 'Por Hacer',
    inProgress: 'En Progreso',
    review: 'Revisión',
    done: 'Completado',
  };
  return titles[columnId] || columnId;
}
