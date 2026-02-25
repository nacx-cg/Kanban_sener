"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface WorkPatternChartProps {
  analysis: {
    lateWorkCount: number;
    lateWorkPercentage: number;
    peakHours: number[];
    averageCompletionTimeByWorkType: Record<string, number>;
    workTypeDistribution: Record<string, number>;
    weakLinks: Array<{
      workType: string;
      completionRate: number;
      averageWaitTime: number;
    }>;
  };
}

export function WorkPatternChart({ analysis }: WorkPatternChartProps) {
  const t = useTranslations();

  const workTypeData = Object.entries(
    analysis.averageCompletionTimeByWorkType
  ).map(([workType, time]) => ({
    workType,
    tiempo: time.toFixed(1),
  }));

  const distributionData = Object.entries(
    analysis.workTypeDistribution
  ).map(([workType, count]) => ({
    workType,
    cantidad: count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.lateWork")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysis.lateWorkCount}</div>
            <p className="text-sm text-gray-500 mt-2">
              {analysis.lateWorkPercentage.toFixed(1)}% del trabajo total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horas Pico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg">
              {analysis.peakHours.length > 0
                ? analysis.peakHours.map((hour) => `${hour}:00`).join(", ")
                : "No hay datos suficientes"}
            </div>
          </CardContent>
        </Card>
      </div>

      {analysis.weakLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.weakLinks")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.weakLinks.map((link, index) => (
                <div
                  key={index}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded"
                >
                  <div className="font-semibold">{link.workType}</div>
                  <div className="text-sm text-gray-600">
                    Tasa de finalización: {link.completionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    Tiempo promedio de espera: {link.averageWaitTime.toFixed(1)}h
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tiempo de Finalización por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="workType" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="tiempo" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Tipo de Trabajo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="workType" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cantidad" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

