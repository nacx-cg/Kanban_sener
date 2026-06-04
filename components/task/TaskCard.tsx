'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, User, Trash2, Pencil, Archive } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { EditTaskForm } from './EditTaskForm';

interface TaskCardProps {
  task: Task & {
    assignee: {
      id: string;
      name: string | null;
      email: string;
    } | null;
    createdBy?: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  };
  boardOwnerId?: string;
  isAdmin?: boolean;
  canArchive?: boolean;
  boardIsShared?: boolean;
  onDeleted?: () => void;
  onTaskUpdated?: () => void;
}

export function TaskCard({ task, boardOwnerId, isAdmin = false, canArchive = false, boardIsShared = false, onDeleted, onTaskUpdated }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const { data: session } = useSession();
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const showArchive = task.status === 'done' && canArchive;

  const priorityColors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  const workTypeLabels: Record<string, string> = {
    feature: 'Funcionalidad',
    bug: 'Error',
    task: 'Tarea',
    research: 'Investigación',
  };

  const priorityLabels: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    critical: 'Crítica',
  };

  const canEdit = isAdmin || (session?.user?.id && boardOwnerId === session.user.id);
  const canDelete = canEdit;

  const onDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (onDeleted) {
          onDeleted();
        } else {
          // Fallback: reload page if no callback
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setDeleting(false);
    }
  };

  const onArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (archiving || task.status !== 'done') return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archivo' }),
      });
      if (res.ok && onTaskUpdated) onTaskUpdated();
    } catch (error) {
      console.error('Error archiving task:', error);
    } finally {
      setArchiving(false);
    }
  };

  // Time-based alerts (24h = yellow, 48h = red) since creation
  let alertBadge: { text: string; className: string } | null = null;
  if (task.createdAt) {
    const createdMs =
      typeof task.createdAt === 'string'
        ? new Date(task.createdAt).getTime()
        : (task.createdAt as unknown as Date).getTime();
    const hoursSince = (Date.now() - createdMs) / (1000 * 60 * 60);
    if (hoursSince >= 48) {
      alertBadge = { text: '48h+', className: 'bg-red-100 text-red-800 border-red-300' };
    } else if (hoursSince >= 24) {
      alertBadge = { text: '24h+', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="hover:shadow-md transition-shadow relative overflow-hidden min-w-0"
    >
      <CardContent className="p-4 space-y-3 relative min-w-0 overflow-hidden">
        {/* Invisible drag handle covering the entire card except the action buttons area */}
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
          style={{ right: (canEdit || showArchive) ? '160px' : '0' }}
        />
        
        {/* Content layer above drag handle */}
        <div className="relative z-10 space-y-3 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <h3 className="font-semibold text-sm mb-1 flex-1 min-w-0 select-none line-clamp-2 break-words">
              {task.title}
            </h3>
            {alertBadge && (
              <Badge variant="outline" className={`text-[10px] h-5 ${alertBadge.className}`}>
                {alertBadge.text}
              </Badge>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 select-none">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-1 min-w-0 overflow-hidden">
            <Badge
              variant="outline"
              className={`text-xs ${priorityColors[task.priority] || ''}`}
            >
              {priorityLabels[task.priority] || task.priority}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {workTypeLabels[task.workType] || task.workType}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground min-w-0">
            {task.dueDate && (
              <div className="flex items-center gap-1 min-w-0 shrink-0">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: es })}
                </span>
              </div>
            )}
            {task.assignee && (
              <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">{task.assignee.name || task.assignee.email}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground min-w-0">
            <span className="select-none truncate min-w-0 flex-1">
              Creado {task.createdAt ? format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm', { locale: es }) : ''}{' '}
              {task.createdBy && `por ${task.createdBy.name || task.createdBy.email}`}
            </span>
            {(canEdit || showArchive) && (
              <div className="inline-flex items-center gap-2 relative z-20 shrink-0">
                {showArchive && (
                  <button
                    onClick={onArchive}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 disabled:opacity-50"
                    disabled={archiving}
                    title="Archivar tarea"
                  >
                    <Archive className="h-3 w-3" />
                    Archivar
                  </button>
                )}
                {canEdit && (
                <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setEditOpen(true);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
                  title="Editar tarea"
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </button>
                <button
                  onClick={onDelete}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                  disabled={deleting}
                  title="Eliminar tarea"
                >
                  <Trash2 className="h-3 w-3" />
                  Eliminar
                </button>
                </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      {canEdit && (
        <EditTaskForm
          task={task}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={() => {
            if (onTaskUpdated) onTaskUpdated();
          }}
          isAdmin={isAdmin}
          boardIsShared={boardIsShared}
        />
      )}
    </Card>
  );
}
