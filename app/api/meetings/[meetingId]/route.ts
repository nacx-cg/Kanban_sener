import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateMeetingSchema = z.object({
  title: z.string().optional().nullable(),
  date: z.string().optional(),
  time: z.string().optional(),
  place: z.string().optional().nullable(),
  hoursAttended: z.number().min(0).optional(),
  attendantIds: z.array(z.string()).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const session = await auth();
    const { meetingId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
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
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Reunión no encontrada' }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: 'Error al obtener reunión' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const session = await auth();
    const { meetingId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        attendants: {
          some: { userId: session.user.id },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Reunión no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const data = updateMeetingSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.time !== undefined) updateData.time = data.time;
    if (data.place !== undefined) updateData.place = data.place;
    if (data.hoursAttended !== undefined) updateData.hoursAttended = data.hoursAttended;

    if (data.attendantIds !== undefined) {
      await prisma.meetingAttendant.deleteMany({
        where: { meetingId },
      });
      await prisma.meetingAttendant.createMany({
        data: data.attendantIds.map((userId) => ({
          meetingId,
          userId,
        })),
      });
    }

    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: updateData,
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

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating meeting:', error);
    return NextResponse.json(
      { error: 'Error al actualizar reunión' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const session = await auth();
    const { meetingId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingId,
        attendants: {
          some: { userId: session.user.id },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Reunión no encontrada' }, { status: 404 });
    }

    await prisma.meeting.delete({
      where: { id: meetingId },
    });

    return NextResponse.json({ message: 'Reunión eliminada' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json(
      { error: 'Error al eliminar reunión' },
      { status: 500 }
    );
  }
}
