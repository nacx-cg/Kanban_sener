'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Archive, CheckCircle, ExternalLink } from 'lucide-react';

interface CompletedArchivedTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  completedAt: string | null;
  createdAt: string;
  board: { id: string; name: string };
  assignee: { id: string; name: string | null; email: string } | null;
  createdBy: { id: string; name: string | null; email: string } | null;
}

export function CompletedArchivedTasksViewer() {
  const [tasks, setTasks] = useState<CompletedArchivedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'done' | 'archivo'>('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/tasks/completed-archived');
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al cargar tareas');
        setTasks([]);
        return;
      }
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching completed/archived tasks:', err);
      setError('Error al cargar tareas');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks =
    filter === 'all'
      ? tasks
      : tasks.filter((t) => t.status === filter);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Cargando tareas completadas y archivadas...
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Tareas Completadas y Archivadas ({filteredTasks.length})
          </CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('done')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 ${
                filter === 'done'
                  ? 'bg-green-600 text-white'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Completadas
            </button>
            <button
              onClick={() => setFilter('archivo')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 ${
                filter === 'archivo'
                  ? 'bg-amber-600 text-white'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <Archive className="h-3.5 w-3.5" />
              Archivadas
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTasks.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            {filter === 'all'
              ? 'No hay tareas completadas ni archivadas.'
              : filter === 'done'
                ? 'No hay tareas completadas.'
                : 'No hay tareas archivadas.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Título</th>
                  <th className="text-left py-3 px-2 font-medium">Tablero</th>
                  <th className="text-left py-3 px-2 font-medium">Estado</th>
                  <th className="text-left py-3 px-2 font-medium">Asignado</th>
                  <th className="text-left py-3 px-2 font-medium">Completado</th>
                  <th className="text-left py-3 px-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <span className="font-medium">{task.title}</span>
                      {task.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-2">{task.board?.name || '-'}</td>
                    <td className="py-3 px-2">
                      <Badge
                        variant={task.status === 'archivo' ? 'secondary' : 'default'}
                        className={
                          task.status === 'archivo'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-green-100 text-green-800 border-green-300'
                        }
                      >
                        {task.status === 'archivo' ? 'Archivada' : 'Completada'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {task.assignee?.name || task.assignee?.email || '-'}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {task.completedAt
                        ? format(new Date(task.completedAt), 'dd/MM/yyyy', {
                            locale: es,
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-2">
                      <Link href={`/es/boards/${task.board?.id}`}>
                        <span className="inline-flex items-center gap-1 text-primary hover:underline">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Ver tablero
                        </span>
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
