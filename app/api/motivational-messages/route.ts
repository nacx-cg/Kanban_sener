import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { writeAuditLog } from '@/lib/audit';
import { z } from 'zod';

const updateMessageSchema = z.object({
  key: z.string(),
  message: z.string().min(1),
  locale: z.string().default('es'),
});

const createMessageSchema = z.object({
  key: z.string().min(1).max(50),
  message: z.string().min(1),
  locale: z.string().default('es'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'es';

    // Get all messages for the locale
    const allMessages = await prisma.motivationalMessage.findMany({
      where: { locale },
      include: {
        changedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        changedAt: 'desc', // Most recently updated first
      },
    });

    // If no messages exist, create default ones
    if (allMessages.length === 0) {
      const messageKeys = ['goodMorning', 'streakMilestone', 'goalProgress', 'keepGoing'];
      const defaultMessages: Record<string, string> = {
        goodMorning: '¡Buenos días! ¡Vamos a hacer que este día sea productivo!',
        streakMilestone: '¡Increíble! Estás en una racha impresionante. ¡Sigue así!',
        goalProgress: '¡Estás cerca de alcanzar tu meta semanal! ¡Sigue adelante!',
        keepGoing: '¡Sigue adelante! Cada tarea completada te acerca a tus objetivos.',
      };

      for (const key of messageKeys) {
        await prisma.motivationalMessage.create({
          data: {
            key,
            message: defaultMessages[key] || '¡Sigue adelante!',
            locale,
          },
        });
      }

      // Fetch again after creating defaults
      const newMessages = await prisma.motivationalMessage.findMany({
        where: { locale },
        include: {
          changedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          changedAt: 'desc',
        },
      });

      const messages: Record<string, any> = {};
      for (const msg of newMessages) {
        messages[msg.key] = {
          message: msg.message,
          editor: msg.changedByUser ? {
            name: msg.changedByUser.name,
            email: msg.changedByUser.email,
          } : null,
          editedAt: msg.changedAt.toISOString(),
        };
      }
      return NextResponse.json(messages);
    }

    // Format messages
    const messages: Record<string, any> = {};
    for (const msg of allMessages) {
      messages[msg.key] = {
        message: msg.message,
        editor: msg.changedByUser ? {
          name: msg.changedByUser.name,
          email: msg.changedByUser.email,
        } : null,
        editedAt: msg.changedAt.toISOString(),
      };
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching motivational messages:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // All authenticated users can edit messages
    const body = await request.json();
    const data = updateMessageSchema.parse(body);

    // Get current message to log old value
    const currentMessage = await prisma.motivationalMessage.findUnique({
      where: {
        key_locale: {
          key: data.key,
          locale: data.locale,
        },
      },
    });

    // Upsert message
    const message = await prisma.motivationalMessage.upsert({
      where: {
        key_locale: {
          key: data.key,
          locale: data.locale,
        },
      },
      update: {
        message: data.message,
        changedBy: session.user.id,
        changedAt: new Date(),
      },
      create: {
        key: data.key,
        message: data.message,
        locale: data.locale,
        changedBy: session.user.id,
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

    // Log old message to history before updating
    if (currentMessage) {
      // We'll use audit logs for history tracking
      await writeAuditLog({
        entityType: 'motivational_message',
        entityId: message.id,
        action: 'update',
        userId: session.user.id,
        metadata: {
          key: data.key,
          locale: data.locale,
          oldMessage: currentMessage.message,
          newMessage: data.message,
        },
      });
    }

    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating motivational message:', error);
    return NextResponse.json(
      { error: 'Error al actualizar mensaje' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // All authenticated users can create messages
    const body = await request.json();
    const data = createMessageSchema.parse(body);

    // Check if message with this key already exists
    const existing = await prisma.motivationalMessage.findUnique({
      where: {
        key_locale: {
          key: data.key,
          locale: data.locale,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un mensaje con esta clave' },
        { status: 400 }
      );
    }

    // Create new message
    const message = await prisma.motivationalMessage.create({
      data: {
        key: data.key,
        message: data.message,
        locale: data.locale,
        changedBy: session.user.id,
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

    // Log creation to audit log
    await writeAuditLog({
      entityType: 'motivational_message',
      entityId: message.id,
      action: 'create',
      userId: session.user.id,
      metadata: {
        key: data.key,
        locale: data.locale,
        message: data.message,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating motivational message:', error);
    return NextResponse.json(
      { error: 'Error al crear mensaje' },
      { status: 500 }
    );
  }
}

