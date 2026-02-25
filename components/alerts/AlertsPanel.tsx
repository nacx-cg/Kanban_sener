"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface Alert {
  type: string;
  severity: "low" | "medium" | "high";
  title: string;
  message: string;
  taskId?: string;
  boardId?: string;
  boardName?: string;
  [key: string]: any;
}

export function AlertsPanel() {
  const t = useTranslations();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/alerts");
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-red-500 bg-red-50";
      case "medium":
        return "border-yellow-500 bg-yellow-50";
      case "low":
        return "border-blue-500 bg-blue-50";
      default:
        return "border-gray-500 bg-gray-50";
    }
  };

  const handleAlertClick = (alert: Alert) => {
    if (alert.boardId && alert.taskId) {
      router.push(`/es/boards/${alert.boardId}`);
    } else if (alert.boardId) {
      router.push(`/es/boards/${alert.boardId}`);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando alertas...</div>;
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No hay alertas en este momento
        </CardContent>
      </Card>
    );
  }

  const alertsBySeverity = {
    high: alerts.filter((a) => a.severity === "high"),
    medium: alerts.filter((a) => a.severity === "medium"),
    low: alerts.filter((a) => a.severity === "low"),
  };

  return (
    <div className="space-y-4">
      {alertsBySeverity.high.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2 text-red-600">
            Alertas Críticas
          </h3>
          <div className="space-y-2">
            {alertsBySeverity.high.map((alert, index) => (
              <Card
                key={index}
                className={`cursor-pointer hover:shadow-md transition-shadow ${getSeverityColor(
                  alert.severity
                )}`}
                onClick={() => handleAlertClick(alert)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-800">
                        {alert.title}
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        {alert.message}
                      </p>
                      {alert.boardName && (
                        <p className="text-xs text-red-600 mt-1">
                          Tablero: {alert.boardName}
                        </p>
                      )}
                    </div>
                    {alert.boardId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/es/boards/${alert.boardId}`);
                        }}
                      >
                        Ver
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {alertsBySeverity.medium.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2 text-yellow-600">
            Alertas Importantes
          </h3>
          <div className="space-y-2">
            {alertsBySeverity.medium.map((alert, index) => (
              <Card
                key={index}
                className={`cursor-pointer hover:shadow-md transition-shadow ${getSeverityColor(
                  alert.severity
                )}`}
                onClick={() => handleAlertClick(alert)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-800">
                        {alert.title}
                      </h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        {alert.message}
                      </p>
                      {alert.boardName && (
                        <p className="text-xs text-yellow-600 mt-1">
                          Tablero: {alert.boardName}
                        </p>
                      )}
                    </div>
                    {alert.boardId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/es/boards/${alert.boardId}`);
                        }}
                      >
                        Ver
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {alertsBySeverity.low.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2 text-blue-600">
            Información
          </h3>
          <div className="space-y-2">
            {alertsBySeverity.low.map((alert, index) => (
              <Card
                key={index}
                className={`cursor-pointer hover:shadow-md transition-shadow ${getSeverityColor(
                  alert.severity
                )}`}
                onClick={() => handleAlertClick(alert)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-800">
                        {alert.title}
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

