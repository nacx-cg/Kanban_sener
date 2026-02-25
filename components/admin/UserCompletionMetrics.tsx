"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { UserCompletionMetric } from "@/lib/analytics";

export function UserCompletionMetrics() {
  const [metrics, setMetrics] = useState<UserCompletionMetric[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics?type=user-completion")
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(setMetrics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Cargando métricas por usuario...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay datos de usuarios.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas de completado por usuario</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tareas completadas por cada usuario (como asignado)
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-medium">Usuario</th>
                <th className="text-right py-3 px-2 font-medium">Hoy</th>
                <th className="text-right py-3 px-2 font-medium">Semana</th>
                <th className="text-right py-3 px-2 font-medium">Mes</th>
                <th className="text-right py-3 px-2 font-medium">Total</th>
                <th className="text-right py-3 px-2 font-medium">Asignadas</th>
                <th className="text-right py-3 px-2 font-medium">% Completado</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.userId} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-2">
                    <span className="font-medium">
                      {m.userName || m.userEmail}
                    </span>
                    {m.userName && (
                      <span className="text-muted-foreground text-xs block">
                        {m.userEmail}
                      </span>
                    )}
                  </td>
                  <td className="text-right py-3 px-2">{m.tasksCompletedToday}</td>
                  <td className="text-right py-3 px-2">{m.tasksCompletedWeek}</td>
                  <td className="text-right py-3 px-2">{m.tasksCompletedMonth}</td>
                  <td className="text-right py-3 px-2">{m.totalCompleted}</td>
                  <td className="text-right py-3 px-2">{m.totalAssigned}</td>
                  <td className="text-right py-3 px-2">
                    {m.completionRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
