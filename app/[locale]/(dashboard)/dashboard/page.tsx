"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
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

type DashboardTab =
  | "overview"
  | "myTasks"
  | "lista"
  | "analytics"
  | "motivation"
  | "alerts"
  | "messages";

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = typeof params?.locale === "string" ? params.locale : "es";
  const { status } = useSession();
  const [publicBoards, setPublicBoards] = useState<Board[]>([]);
  const [privateBoards, setPrivateBoards] = useState<Board[]>([]);
  const [productivityMetrics, setProductivityMetrics] = useState<any>(null);
  const [workPatternAnalysis, setWorkPatternAnalysis] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  const loadedExtras = useRef({
    overview: false,
    analytics: false,
    motivation: false,
  });

  const fetchBoards = useCallback(async () => {
    const [boardsRes, meRes] = await Promise.all([
      fetch("/api/boards"),
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
  }, []);

  const fetchOverviewExtras = useCallback(async () => {
    if (loadedExtras.current.overview) return;
    loadedExtras.current.overview = true;

    try {
      const [metricsRes, statsRes] = await Promise.all([
        fetch("/api/analytics?type=productivity"),
        fetch("/api/user-stats"),
      ]);

      if (metricsRes.ok) {
        setProductivityMetrics(await metricsRes.json());
      }
      if (statsRes.ok) {
        setUserStats(await statsRes.json());
      }
    } catch (error) {
      console.error("Error fetching overview extras:", error);
      loadedExtras.current.overview = false;
    }
  }, []);

  const fetchAnalyticsExtras = useCallback(async () => {
    if (loadedExtras.current.analytics) return;
    loadedExtras.current.analytics = true;

    try {
      const analysisRes = await fetch("/api/analytics?type=work-patterns");
      if (analysisRes.ok) {
        setWorkPatternAnalysis(await analysisRes.json());
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      loadedExtras.current.analytics = false;
    }
  }, []);

  const fetchMotivationExtras = useCallback(async () => {
    if (loadedExtras.current.motivation) return;
    loadedExtras.current.motivation = true;

    try {
      const requests: Promise<Response>[] = [fetch("/api/achievements")];
      if (!userStats) {
        requests.push(fetch("/api/user-stats"));
      }

      const [achievementsRes, statsRes] = await Promise.all(requests);

      if (achievementsRes.ok) {
        setAchievements(await achievementsRes.json());
      }
      if (statsRes?.ok) {
        setUserStats(await statsRes.json());
      }
    } catch (error) {
      console.error("Error fetching motivation data:", error);
      loadedExtras.current.motivation = false;
    }
  }, [userStats]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace(`/${locale}/login`);
      return;
    }

    if (status === "authenticated") {
      (async () => {
        try {
          await fetchBoards();
        } catch (error) {
          console.error("Error fetching boards:", error);
        } finally {
          setLoading(false);
        }
        // Non-blocking: metrics + streak banner after first paint
        void fetchOverviewExtras();
      })();
    }
  }, [status, locale, router, fetchBoards, fetchOverviewExtras]);

  useEffect(() => {
    if (loading || status !== "authenticated") return;

    if (activeTab === "overview") {
      void fetchOverviewExtras();
    } else if (activeTab === "analytics") {
      void fetchAnalyticsExtras();
    } else if (activeTab === "motivation") {
      void fetchMotivationExtras();
    }
  }, [
    activeTab,
    loading,
    status,
    fetchOverviewExtras,
    fetchAnalyticsExtras,
    fetchMotivationExtras,
  ]);

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
        <Button onClick={() => router.push(`/${locale}/boards/new`)}>
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

          {privateBoards.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Panel del usuario — Mis tableros privados</h2>
              <AllBoardsViewer
                boards={privateBoards}
                onReordered={fetchBoards}
                showRanking={false}
              />
            </div>
          )}

          <div className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold">{t("dashboard.activeBoards")}</h2>
            <ActiveBoardsViewer
              boards={publicBoards}
              onReordered={fetchBoards}
              showRanking
            />
          </div>

          <div className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold">{t("dashboard.allBoards")}</h2>
            <AllBoardsViewer
              boards={publicBoards}
              onReordered={fetchBoards}
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
          {workPatternAnalysis ? (
            <WorkPatternChart analysis={workPatternAnalysis} />
          ) : (
            <p className="text-muted-foreground">Cargando analíticas...</p>
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
