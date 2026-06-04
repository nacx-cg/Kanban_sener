'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalLink, ClipboardList } from 'lucide-react';

interface AssignedTask {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  board: { id: string; name: string };
}

const statusLabels: Record<string, string> = {
  todo: 'Por Hacer',
  inProgress: 'En Progreso',
  review: 'Revisión',
  done: 'Completado',
};

export function MyAssignedTasksViewer() {
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/tasks/assigned-to-me');
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al cargar tareas');
        setTasks([]);
        return;
      }
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching assigned tasks:', err);
      setError('Error al cargar tareas asignadas');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Cargando mis tareas...
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Mis Tareas Asignadas ({tasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No tienes tareas asignadas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Título</th>
                  <th className="text-left py-3 px-2 font-medium">Tablero</th>
                  <th className="text-left py-3 px-2 font-medium">Estado</th>
                  <th className="text-left py-3 px-2 font-medium">Fecha límite</th>
                  <th className="text-left py-3 px-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 font-medium">{task.title}</td>
                    <td className="py-3 px-2">{task.board?.name || '-'}</td>
                    <td className="py-3 px-2">
                      <Badge variant="outline">
                        {statusLabels[task.status] || task.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {task.dueDate
                        ? format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: es })
                        : '-'}
                    </td>
                    <td className="py-3 px-2">
                      <Link
                        href={`/es/boards/${task.board?.id}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ir al tablero
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
