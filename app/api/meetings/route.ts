import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createMeetingSchema = z.object({
  title: z.string().optional(),
  date: z.string(),
  time: z.string(),
  place: z.string().optional(),
  hoursAttended: z.number().min(0),
  attendantIds: z.array(z.string()),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const meetings = await prisma.meeting.findMany({
      where: {
        attendants: {
          some: { userId: session.user.id },
        },
      },
      include: {
        attendants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: 'Error al obtener reuniones' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = createMeetingSchema.parse(body);

    const meeting = await prisma.meeting.create({
      data: {
        title: data.title || null,
        date: new Date(data.date),
        time: data.time,
        place: data.place || null,
        hoursAttended: data.hoursAttended,
        attendants: {
          create: data.attendantIds.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        attendants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: 'Error al crear reunión' },
      { status: 500 }
    );
  }
}
