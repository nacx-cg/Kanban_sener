"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductivityMetrics } from "@/components/dashboard/ProductivityMetrics";
import { WorkPatternChart } from "@/components/analytics/WorkPatternChart";
import { StreakDisplay } from "@/components/motivation/StreakDisplay";
import { AchievementBadge } from "@/components/motivation/AchievementBadge";
import { MotivationalMessage } from "@/components/motivation/MotivationalMessage";
import { AlertsPanel } from "@/components/alerts/AlertsPanel";
import { ActiveBoardsViewer } from "@/components/dashboard/ActiveBoardsViewer";
import { AllBoardsViewer } from "@/components/dashboard/AllBoardsViewer";
import { EditMotivationalMessages } from "@/components/admin/EditMotivationalMessages";
import { UserCompletionMetrics } from "@/components/admin/UserCompletionMetrics";
import { AssignedTasksPerUserChart } from "@/components/admin/AssignedTasksPerUserChart";
import { MeetingHoursPerUserChart } from "@/components/admin/MeetingHoursPerUserChart";
import { MyAssignedTasksViewer } from "@/components/dashboard/MyAssignedTasksViewer";
import { CompletedArchivedTasksViewer } from "@/components/dashboard/CompletedArchivedTasksViewer";

interface Board {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  tasks: any[];
  _count: { tasks: number };
  user?: { name: string | null; email: string };
  team?: { id: string; name: string; isPublic: boolean } | null;
}

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = typeof params?.locale === "string" ? params.locale : "es";
  const { data: session, status } = useSession();
  const [publicBoards, setPublicBoards] = useState<Board[]>([]);
  const [privateBoards, setPrivateBoards] = useState<Board[]>([]);
  const [productivityMetrics, setProductivityMetrics] = useState<any>(null);
  const [workPatternAnalysis, setWorkPatternAnalysis] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "myTasks" | "lista" | "analytics" | "motivation" | "alerts" | "messages">("overview");

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace(`/${locale}/login`);
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, locale, router]);

  const fetchData = async () => {
    try {
      const [boardsRes, metricsRes, analysisRes, statsRes, achievementsRes, meRes] = await Promise.all([
        fetch("/api/boards"),
        fetch("/api/analytics?type=productivity"),
        fetch("/api/analytics?type=work-patterns"),
        fetch("/api/user-stats"),
        fetch("/api/achievements"),
        fetch("/api/users/me"),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setIsAdmin(meData.isAdmin ?? false);
      }

      if (boardsRes.ok) {
        const boardsData = await boardsRes.json();
        setPublicBoards(boardsData.publicBoards || []);
        setPrivateBoards(boardsData.privateBoards || []);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setProductivityMetrics(metricsData);
      }

      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        setWorkPatternAnalysis(analysisData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setUserStats(statsData);
      }

      if (achievementsRes.ok) {
        const achievementsData = await achievementsRes.json();
        setAchievements(achievementsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  const weeklyProgress = productivityMetrics?.tasksCompletedWeek || 0;
  const weeklyGoal = userStats?.weeklyGoal || 5;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("navigation.dashboard")}</h1>
        <Button onClick={() => router.push("/es/boards/new")}>
          {t("board.createBoard")}
        </Button>
      </div>

      {userStats && (
        <div className="mb-6">
          <MotivationalMessage
            currentStreak={userStats.currentStreak || 0}
            weeklyProgress={weeklyProgress}
            weeklyGoal={weeklyGoal}
          />
        </div>
      )}

      <div className="mb-6">
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-medium ${
              activeTab === "overview"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600"
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab("myTasks")}
            className={`px-4 py-2 font-medium ${
              activeTab === "myTasks"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600"
            }`}
          >
            Mis Tareas
          </button>
          <button
            onClick={() => setActiveTab("lista")}
            className={`px-4 py-2 font-medium ${
              activeTab === "lista"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600"
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 font-medium ${
              activeTab === "analytics"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600"
            }`}
          >
            Analíticas
          </button>
          <button
            onClick={() => setActiveTab("motivation")}
            className={`px-4 py-2 font-medium ${
              activeTab === "motivation"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600"
            }`}
          >
            Seguimiento
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-4 py-2 font-medium ${
              activeTab === "alerts"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600"
            }`}
          >
            Alertas
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`px-4 py-2 font-medium ${
              activeTab === "messages"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600"
            }`}
          >
            Mensajes Grupales
          </button>
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8">
          {productivityMetrics && (
            <ProductivityMetrics metrics={productivityMetrics} />
          )}

          {/* User panel - private boards on top */}
          {privateBoards.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Panel del usuario — Mis tableros privados</h2>
              <AllBoardsViewer
                boards={privateBoards}
                onReordered={fetchData}
                showRanking={false}
              />
            </div>
          )}

          {/* Active Boards Viewer - public boards with tasks only */}
          <div className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold">{t("dashboard.activeBoards")}</h2>
            <ActiveBoardsViewer
              boards={publicBoards}
              onReordered={fetchData}
              showRanking
            />
          </div>

          {/* All Boards Viewer - all public boards */}
          <div className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold">{t("dashboard.allBoards")}</h2>
            <AllBoardsViewer
              boards={publicBoards}
              onReordered={fetchData}
              showRanking
            />
          </div>
        </div>
      )}

      {activeTab === "myTasks" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Mis Tareas Asignadas</h2>
          <MyAssignedTasksViewer />
        </div>
      )}

      {activeTab === "lista" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Tareas Completadas y Archivadas</h2>
          <CompletedArchivedTasksViewer />
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          {workPatternAnalysis && (
            <WorkPatternChart analysis={workPatternAnalysis} />
          )}
          {isAdmin && (
            <div className="space-y-6">
              <AssignedTasksPerUserChart />
              <MeetingHoursPerUserChart />
              <UserCompletionMetrics />
            </div>
          )}
        </div>
      )}

      {activeTab === "motivation" && (
        <div className="space-y-6">
          {userStats && (
            <StreakDisplay
              currentStreak={userStats.currentStreak || 0}
              longestStreak={userStats.longestStreak || 0}
              weeklyGoal={userStats.weeklyGoal || 5}
              weeklyProgress={weeklyProgress}
            />
          )}

          <div>
            <h2 className="text-2xl font-bold mb-4">{t("behavioral.achievements")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.length > 0 ? (
                achievements.map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} />
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500">
                      Aún no has desbloqueado logros. ¡Completa tareas para empezar!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

        </div>
      )}

      {activeTab === "alerts" && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Alertas y Notificaciones</h2>
          <AlertsPanel />
        </div>
      )}

      {activeTab === "messages" && (
        <div>
          <EditMotivationalMessages />
        </div>
      )}
    </div>
  );
}
