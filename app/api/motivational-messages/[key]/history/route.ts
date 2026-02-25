import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { key } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'es';

    // Get current message to find its ID
    const message = await prisma.motivationalMessage.findUnique({
      where: {
        key_locale: {
          key,
          locale,
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    // Get audit logs for this message (update actions only)
    const allLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'motivational_message',
        entityId: message.id,
        action: 'update',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Get last 10 updates
    });

    // Format history entries - show old messages (previous versions)
    const formattedHistory = allLogs
      .filter((log) => {
        const metadata = log.metadata as any;
        return metadata?.oldMessage; // Only include entries with old messages
      })
      .map((log) => ({
        id: log.id,
        message: (log.metadata as any)?.oldMessage || '',
        changedBy: {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email,
        },
        changedAt: log.createdAt,
      }));

    return NextResponse.json(formattedHistory);
  } catch (error) {
    console.error('Error fetching message history:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial' },
      { status: 500 }
    );
  }
}

