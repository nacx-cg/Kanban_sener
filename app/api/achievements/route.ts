import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const achievements = await prisma.achievement.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        unlockedAt: "desc",
      },
    });

    return NextResponse.json(achievements);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener los logros" },
      { status: 500 }
    );
  }
}

