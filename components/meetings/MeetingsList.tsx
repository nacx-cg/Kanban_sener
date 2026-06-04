'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, MapPin, Clock, Users, Plus } from 'lucide-react';
import { CreateMeetingForm } from './CreateMeetingForm';

interface Meeting {
  id: string;
  title: string | null;
  date: string;
  time: string;
  place: string | null;
  hoursAttended: number;
  attendants: Array<{
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
}

export function MeetingsList() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/meetings');
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al cargar reuniones');
        setMeetings([]);
        return;
      }
      const data = await res.json();
      setMeetings(data);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError('Error al cargar reuniones');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Cargando reuniones...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reuniones Asistidas</h2>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Registrar Reunión
        </Button>
      </div>

      <CreateMeetingForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchMeetings}
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado de reuniones</CardTitle>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              No has registrado reuniones aún.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Título</th>
                    <th className="text-left py-3 px-4 font-medium">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium">Hora</th>
                    <th className="text-left py-3 px-4 font-medium">Lugar</th>
                    <th className="text-left py-3 px-4 font-medium">Horas asistidas</th>
                    <th className="text-left py-3 px-4 font-medium">Asistentes</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting) => (
                    <tr key={meeting.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">
                        {meeting.title || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {format(new Date(meeting.date), 'dd/MM/yyyy', { locale: es })}
                      </td>
                      <td className="py-3 px-4">{meeting.time}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {meeting.place || '-'}
                      </td>
                      <td className="py-3 px-4">{meeting.hoursAttended}h</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {meeting.attendants.map((a) => (
                            <span
                              key={a.user.id}
                              className="text-xs bg-muted px-2 py-0.5 rounded"
                            >
                              {a.user.name || a.user.email}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
