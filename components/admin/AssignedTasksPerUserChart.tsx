'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface UserCompletionMetric {
  userId: string;
  userName: string | null;
  userEmail: string;
  totalAssigned: number;
}

export function AssignedTasksPerUserChart() {
  const [data, setData] = useState<{ name: string; assigned: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/analytics?type=user-completion')
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((metrics: UserCompletionMetric[]) => {
        const chartData = metrics
          .filter((m) => m.totalAssigned > 0)
          .map((m) => ({
            name: m.userName || m.userEmail || 'Sin nombre',
            assigned: m.totalAssigned,
          }))
          .sort((a, b) => b.assigned - a.assigned);
        setData(chartData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Cargando gráfico...
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

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tareas asignadas por usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            No hay datos de tareas asignadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tareas asignadas por usuario</CardTitle>
        <p className="text-sm text-muted-foreground">
          Número de tareas asignadas a cada usuario
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                formatter={(value: number) => [value, 'Tareas asignadas']}
                labelFormatter={(label) => `Usuario: ${label}`}
              />
              <Bar dataKey="assigned" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
