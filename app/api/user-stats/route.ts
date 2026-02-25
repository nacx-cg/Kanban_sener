import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateStatsSchema = z.object({
  weeklyGoal: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let userStats = await prisma.userStats.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!userStats) {
      userStats = await prisma.userStats.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    return NextResponse.json(userStats);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener las estadísticas" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = updateStatsSchema.parse(body);

    const userStats = await prisma.userStats.upsert({
      where: {
        userId: session.user.id,
      },
      update: data,
      create: {
        userId: session.user.id,
        ...data,
      },
    });

    return NextResponse.json(userStats);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar las estadísticas" },
      { status: 500 }
    );
  }
}

