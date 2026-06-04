import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isAdminUser } from '@/lib/auth-helpers';
import { z } from 'zod';

const updateUserSchema = z.object({
  userId: z.string(),
  role: z.enum(['user', 'admin', 'manager']).optional(),
  isActive: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  isHidden: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Solo administradores pueden ver usuarios' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isApproved: true,
        isHidden: true,
        createdAt: true,
      },
      orderBy: { email: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Solo administradores pueden modificar usuarios' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updateUserSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isApproved !== undefined) updateData.isApproved = data.isApproved;
    if (data.isHidden !== undefined) updateData.isHidden = data.isHidden;

    const user = await prisma.user.update({
      where: { id: data.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isApproved: true,
        isHidden: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}
