import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { hashPassword, comparePassword } from '@/utils/auth';
import { logAction } from '@/utils/permissions';
import { profileUpdateSchema } from '@/lib/schemas';

/**
 * GET - Retrieve current authenticated user's profile
 */
export async function GET() {
  try {
    const currentUser = await getUserFromRequest();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid credentials' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Profile GET handler error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update authenticated user's own profile (name, email, password)
 */
export async function PATCH(req: Request) {
  try {
    const currentUser = await getUserFromRequest();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid credentials' },
        { status: 401 }
      );
    }

    // Parse and validate body
    const body = await req.json();
    const validation = profileUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, currentPassword, newPassword } = validation.data;

    // Fetch current user from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build dynamic update payload
    const updateData: Record<string, string> = {};

    if (name !== undefined) updateData.name = name;

    if (email !== undefined && email !== dbUser.email) {
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser && existingUser.id !== dbUser.id) {
        return NextResponse.json(
          { error: 'Conflict: This email address is already registered to another account.' },
          { status: 409 }
        );
      }
      updateData.email = email;
    }

    // Handle password change with current password verification
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to set a new password.' },
          { status: 400 }
        );
      }

      const isValid = await comparePassword(currentPassword, dbUser.password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect.' },
          { status: 401 }
        );
      }

      updateData.password = await hashPassword(newPassword);
    }

    // Only proceed if there's something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No changes provided.' },
        { status: 400 }
      );
    }

    // Apply updates
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.userId },
      data: updateData,
    });

    // Audit log
    await logAction(currentUser.userId, 'UPDATE_PROFILE', 'AuditLogs', {
      fieldsUpdated: Object.keys(updateData).filter((k) => k !== 'password'),
      passwordChanged: !!newPassword,
    });

    return NextResponse.json(
      {
        message: 'Profile updated successfully.',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Profile PATCH handler error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
