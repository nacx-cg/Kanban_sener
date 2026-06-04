import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getProductivityMetrics,
  getWorkPatternAnalysis,
  getTaskCompletionMetricsPerUser,
  getMeetingHoursPerUser,
} from "@/lib/analytics";
import { isAdminUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "productivity";

    if (type === "productivity") {
      const metrics = await getProductivityMetrics(session.user.id);
      return NextResponse.json(metrics);
    } else if (type === "work-patterns") {
      const workHoursStart = parseInt(searchParams.get("workHoursStart") || "9");
      const workHoursEnd = parseInt(searchParams.get("workHoursEnd") || "18");
      const analysis = await getWorkPatternAnalysis(
        session.user.id,
        workHoursStart,
        workHoursEnd
      );
      return NextResponse.json(analysis);
    } else if (type === "user-completion") {
      const isAdmin = await isAdminUser(session.user.id);
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Solo administradores pueden ver métricas por usuario" },
          { status: 403 }
        );
      }
      const metrics = await getTaskCompletionMetricsPerUser();
      return NextResponse.json(metrics);
    } else if (type === "meeting-hours") {
      const isAdmin = await isAdminUser(session.user.id);
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Solo administradores pueden ver horas de reuniones" },
          { status: 403 }
        );
      }
      const data = await getMeetingHoursPerUser();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: "Tipo de análisis no válido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in analytics:", error);
    return NextResponse.json(
      { error: "Error al obtener las analíticas" },
      { status: 500 }
    );
  }
}

