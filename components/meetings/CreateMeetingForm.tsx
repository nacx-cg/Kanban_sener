'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface CreateMeetingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateMeetingForm({
  open,
  onOpenChange,
  onSuccess,
}: CreateMeetingFormProps) {
  const tCommon = useTranslations('common');
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [hoursAttended, setHoursAttended] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchUsers();
      if (session?.user?.id) {
        setSelectedUserIds([session.user.id]);
      }
    }
  }, [open, session?.user?.id]);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setFetchingUsers(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const hours = parseFloat(hoursAttended);
    if (isNaN(hours) || hours < 0) {
      setError('Horas asistidas debe ser un número válido');
      return;
    }
    if (!date || !time) {
      setError('Fecha y hora son requeridos');
      return;
    }
    if (selectedUserIds.length === 0) {
      setError('Debe al menos un asistente');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || undefined,
          date,
          time,
          place: place.trim() || undefined,
          hoursAttended: hours,
          attendantIds: selectedUserIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al crear reunión');
        return;
      }
      setTitle('');
      setDate('');
      setTime('');
      setPlace('');
      setHoursAttended('');
      setSelectedUserIds(session?.user?.id ? [session.user.id] : []);
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError('Error al crear reunión');
      console.error('Error creating meeting:', err);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Reunión</DialogTitle>
          <DialogDescription>
            Registra una reunión asistida con fecha, hora, lugar y asistentes.
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
              <Label htmlFor="meeting-title">Título (opcional)</Label>
              <Input
                id="meeting-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                placeholder="Ej: Reunión de equipo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-date">Fecha *</Label>
                <Input
                  id="meeting-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-time">Hora *</Label>
                <Input
                  id="meeting-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-place">Lugar (opcional)</Label>
              <Input
                id="meeting-place"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                disabled={loading}
                placeholder="Ej: Sala 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-hours">Horas asistidas *</Label>
              <Input
                id="meeting-hours"
                type="number"
                step="0.5"
                min="0"
                value={hoursAttended}
                onChange={(e) => setHoursAttended(e.target.value)}
                required
                disabled={loading}
                placeholder="1.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Asistentes *</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                    />
                    <span className="text-sm">
                      {user.name || user.email}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : tCommon('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
