import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ensureUserHasPublicTeamAccess } from '@/lib/team-helpers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este correo electrónico ya está registrado' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (pending admin approval)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        isApproved: false,
      },
    });

    // Create user stats
    await prisma.userStats.create({
      data: {
        userId: user.id,
      },
    });

    // Add user to all public teams
    try {
      await ensureUserHasPublicTeamAccess(user.id);
    } catch (error) {
      console.error('Error adding user to public teams:', error);
      // Don't fail registration if team assignment fails
    }

    return NextResponse.json(
      {
        message:
          'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador.',
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    );
  }
}
