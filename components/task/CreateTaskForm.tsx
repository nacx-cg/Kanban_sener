'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface CreateTaskFormProps {
  boardId: string;
  status?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  isAdmin?: boolean;
  boardIsShared?: boolean;
}

export function CreateTaskForm({
  boardId,
  status,
  open,
  onOpenChange,
  onSuccess,
  isAdmin = false,
  boardIsShared = false,
}: CreateTaskFormProps) {
  const t = useTranslations('task');
  const tCommon = useTranslations('common');
  const { data: session } = useSession();
  
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('none');
  const [selectedStatus, setSelectedStatus] = useState<string>(status || 'todo');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [error, setError] = useState('');

  // Fetch users when dialog opens
  useEffect(() => {
    if (open && users.length === 0) {
      fetchUsers();
    }
  }, [open]);

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

  // Determine which users to show in assignee dropdown
  const getAvailableUsers = () => {
    if (!boardIsShared || isAdmin) {
      // Show all users for personal boards or if user is admin
      return users;
    }
    // For shared boards, non-admin users can only assign to themselves
    if (session?.user?.id) {
      return users.filter((user) => user.id === session.user.id);
    }
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
      // Auto-assign to current user if board is shared and user is not admin
      let finalAssigneeId = assigneeId;
      if (boardIsShared && !isAdmin && session?.user?.id) {
        finalAssigneeId = session.user.id;
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId,
          title: title.trim(),
          status: selectedStatus || 'todo',
          assigneeId: finalAssigneeId === 'none' ? undefined : finalAssigneeId,
          workType: 'task',
          priority: 'medium',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al crear tarea');
        return;
      }

      // Reset form
      setTitle('');
      // Auto-assign to current user if board is shared and user is not admin
      if (boardIsShared && !isAdmin && session?.user?.id) {
        setAssigneeId(session.user.id);
      } else {
        setAssigneeId('none');
      }
      setSelectedStatus(status || 'todo');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError('Error al crear tarea');
      console.error('Error creating task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      // Auto-assign to current user if board is shared and user is not admin
      if (boardIsShared && !isAdmin && session?.user?.id) {
        setAssigneeId(session.user.id);
      } else {
        setAssigneeId('none');
      }
      setError('');
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('createTask')}</DialogTitle>
          <DialogDescription>
            {t('addTask')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">{t('title')} *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
                placeholder={t('taskTitle')}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee">{t('assignee')}</Label>
              <Select
                value={assigneeId}
                onValueChange={setAssigneeId}
                disabled={loading || fetchingUsers || (boardIsShared && !isAdmin)}
              >
                <SelectTrigger id="assignee">
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
              {boardIsShared && !isAdmin && (
                <p className="text-xs text-muted-foreground">
                  {t('assignToSelfOnly')}
                </p>
              )}
            </div>
            {!status && (
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                  disabled={loading}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Por Hacer</SelectItem>
                    <SelectItem value="inProgress">En Progreso</SelectItem>
                    <SelectItem value="review">Revisión</SelectItem>
                    <SelectItem value="done">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? t('creating') : tCommon('create')}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

