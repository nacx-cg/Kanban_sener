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
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MeetingHoursData {
  users: Array<{
    userId: string;
    userName: string | null;
    userEmail: string;
    totalHours: number;
    meetings: Array<{ meetingId: string; meetingTitle: string; hours: number }>;
  }>;
  meetings: Array<{ id: string; title: string }>;
  byDay: Array<Record<string, string | number>>;
  byDayMeetingDetails?: Record<
    string,
    Record<string, Array<{ meetingTitle: string; hours: number }>>
  >;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(220 70% 50%)',
  'hsl(280 60% 55%)',
  'hsl(160 60% 45%)',
  'hsl(30 80% 55%)',
  'hsl(340 70% 55%)',
];

export function MeetingHoursPerUserChart() {
  const [data, setData] = useState<MeetingHoursData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/analytics?type=meeting-hours')
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((raw: MeetingHoursData) => {
        setData(raw);
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

  const hasData =
    data?.byDay?.length && data.byDay.length > 0 && data.users.length > 0;

  if (!data || !hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Horas en reuniones por día</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">
            No hay datos de reuniones.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horas en reuniones por día</CardTitle>
        <p className="text-sm text-muted-foreground">
          Horas por día apiladas por usuario (eje X: día, eje Y: horas)
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.byDay}
              margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 11 }}
              />
              <YAxis allowDecimals={true} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length || !label) return null;
                  const details = data.byDayMeetingDetails?.[label as string];
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="mb-2 font-medium">Día: {label}</p>
                      <div className="space-y-2 text-sm">
                        {payload
                          .filter((p) => p.value && Number(p.value) > 0)
                          .map((p) => {
                            const user = data.users.find(
                              (u) => u.userId === p.name
                            );
                            const userName =
                              user?.userName || user?.userEmail || p.name;
                            const meetings =
                              details?.[p.name as string] ?? [];
                            return (
                              <div key={p.name as string}>
                                <span
                                  className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle"
                                  style={{ backgroundColor: p.color }}
                                />
                                <span className="font-medium">{userName}</span>
                                <span className="text-muted-foreground">
                                  {' '}
                                  — {Number(p.value)} h
                                </span>
                                {meetings.length > 0 && (
                                  <ul className="mt-1 ml-3.5 text-muted-foreground list-disc">
                                    {meetings.map((m, i) => (
                                      <li key={i}>
                                        {m.meetingTitle}: {m.hours} h
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                formatter={(value) => {
                  const user = data.users.find((u) => u.userId === value);
                  return user?.userName || user?.userEmail || value;
                }}
              />
              {data.users.map((user, i) => (
                <Bar
                  key={user.userId}
                  dataKey={user.userId}
                  stackId="hours"
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  radius={
                    i === data.users.length - 1 ? [4, 4, 0, 0] : 0
                  }
                  name={user.userId}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
