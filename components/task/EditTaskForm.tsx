'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface TaskForEdit {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeId: string | null;
  dueDate: string | Date | null;
  assignee?: { id: string; name: string | null; email: string } | null;
}

interface EditTaskFormProps {
  task: TaskForEdit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isAdmin?: boolean;
  boardIsShared?: boolean;
}

export function EditTaskForm({
  task,
  open,
  onOpenChange,
  onSuccess,
  isAdmin = false,
  boardIsShared = false,
}: EditTaskFormProps) {
  const t = useTranslations('task');
  const tCommon = useTranslations('common');
  const { data: session } = useSession();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [assigneeId, setAssigneeId] = useState<string>(task.assigneeId || 'none');
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setDescription(task.description || '');
      setAssigneeId(task.assigneeId || 'none');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setStatus(task.status);
      setPriority(task.priority);
      fetchUsers();
    }
  }, [open, task]);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setFetchingUsers(false);
    }
  };

  const getAvailableUsers = () => {
    if (!boardIsShared || isAdmin) return users;
    if (session?.user?.id) return users.filter((u) => u.id === session.user.id);
    return [];
  };

  const availableUsers = getAvailableUsers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        assigneeId: assigneeId === 'none' ? null : assigneeId,
        dueDate: dueDate || null,
      };
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Error al actualizar tarea');
        return;
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError('Error al actualizar tarea');
      console.error('Error updating task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tCommon('edit')} {t('task')}</DialogTitle>
          <DialogDescription>Modificar tarea: asignado, fecha límite, estado, etc.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-title">{t('title')} *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t('description')}</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-assignee">{t('assignee')}</Label>
              <Select
                value={assigneeId}
                onValueChange={setAssigneeId}
                disabled={loading || fetchingUsers || (boardIsShared && !isAdmin)}
              >
                <SelectTrigger id="edit-assignee">
                  <SelectValue placeholder={t('selectAssignee')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('noAssignee')}</SelectItem>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">{t('dueDate')}</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={status} onValueChange={setStatus} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Por Hacer</SelectItem>
                    <SelectItem value="inProgress">En Progreso</SelectItem>
                    <SelectItem value="review">Revisión</SelectItem>
                    <SelectItem value="done">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('priority')}</Label>
                <Select value={priority} onValueChange={setPriority} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Guardando...' : tCommon('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
