'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, LayoutGrid } from 'lucide-react';

interface TaskWithRelations {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  assignee: { id: string; name: string | null; email: string } | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  board: { id: string; name: string };
}

interface Board {
  id: string;
  name: string;
}

const statusLabels: Record<string, string> = {
  todo: 'Por Hacer',
  inProgress: 'En Progreso',
  review: 'Revisión',
  done: 'Completado',
};

export function AdminTasksList() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterBoardId, setFilterBoardId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchTasks();
  }, [filterBoardId, filterStatus]);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = await fetch('/api/boards/all');
      if (res.ok) {
        const data = await res.json();
        setBoards(data);
      }
    } catch (err) {
      console.error('Error fetching boards:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filterBoardId && filterBoardId !== 'all') params.set('boardId', filterBoardId);
      if (filterStatus && filterStatus !== 'all') params.set('status', filterStatus);
      const res = await fetch(`/api/tasks/all?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al cargar tareas');
        setTasks([]);
        return;
      }
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Error al cargar tareas');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Todas las Tareas</h2>
        <p className="text-muted-foreground">
          Vista de todas las tareas del sistema con asignado y tablero.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tablero</label>
          <Select value={filterBoardId} onValueChange={setFilterBoardId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos los tableros" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tableros</SelectItem>
              {boards.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Estado</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando tareas...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Panel de tareas ({tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay tareas que coincidan con los filtros.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Título</th>
                      <th className="text-left py-3 px-2 font-medium">Tablero</th>
                      <th className="text-left py-3 px-2 font-medium">Estado</th>
                      <th className="text-left py-3 px-2 font-medium">Asignado a</th>
                      <th className="text-left py-3 px-2 font-medium">Creado por</th>
                      <th className="text-left py-3 px-2 font-medium">Fecha</th>
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
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {task.assignee ? (
                              <span>{task.assignee.name || task.assignee.email}</span>
                            ) : (
                              <span className="text-muted-foreground italic">Sin asignar</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          {task.createdBy?.name || task.createdBy?.email || '-'}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {format(new Date(task.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
