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

    const message = await prisma.motivationalMessage.findUnique({
      where: {
        key_locale: {
          key,
          locale,
        },
      },
      include: {
        changedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error fetching motivational message:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensaje' },
      { status: 500 }
    );
  }
}

