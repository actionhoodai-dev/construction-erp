import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { hashPassword } from '@/utils/auth';
import { logAction } from '@/utils/permissions';
import { supervisorUpdateSchema } from '@/lib/schemas';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH - Update a supervisor's details or granular module permissions (Admin only)
 */
export async function PATCH(req: Request, context: RouteContext) {
  try {
    // 1. Authenticate user
    const currentUser = await getUserFromRequest();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid credentials' },
        { status: 401 }
      );
    }

    // 2. Authorize: ADMIN only
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges. Admin only.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // 3. Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser || targetUser.role !== 'SUPERVISOR') {
      return NextResponse.json(
        { error: 'Not Found: Target supervisor account does not exist' },
        { status: 404 }
      );
    }

    // 4. Validate incoming payload using Zod schema
    const body = await req.json();
    const validation = supervisorUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, isActive, projectId, permissions } = validation.data;

    // 5. Build dynamic update model payload
    const updateData: Record<string, string | boolean | null> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (projectId !== undefined) updateData.projectId = projectId;
    if (password !== undefined && password.trim() !== '') {
      updateData.password = await hashPassword(password);
    }

    // 6. Run updates in a single database transaction
    const updatedUser = await prisma.$transaction(async (tx: any) => {
      // Perform base user updates
      let userRecord = targetUser;
      if (Object.keys(updateData).length > 0) {
        userRecord = await tx.user.update({
          where: { id },
          data: updateData,
        });
      }

      // Upsert module permissions
      if (permissions && permissions.length > 0) {
        for (const p of permissions) {
          await tx.permission.upsert({
            where: {
              userId_moduleId: {
                userId: id,
                moduleId: p.moduleId,
              },
            },
            update: {
              canRead: p.canRead,
              canWrite: p.canWrite,
            },
            create: {
              userId: id,
              moduleId: p.moduleId,
              canRead: p.canRead,
              canWrite: p.canWrite,
            },
          });
        }
      }

      return userRecord;
    });

    // 7. Audit log actions based on what changed
    await logAction(currentUser.userId, 'UPDATE_SUPERVISOR', 'Employees', {
      affectedSupervisorId: id,
      affectedSupervisorEmail: updatedUser.email,
      updatesApplied: {
        nameUpdated: name !== undefined,
        emailUpdated: email !== undefined,
        statusUpdated: isActive !== undefined,
        projectIdUpdated: projectId !== undefined,
        passwordUpdated: password !== undefined,
        permissionsCount: permissions?.length || 0,
      },
    });

    return NextResponse.json(
      {
        message: 'Supervisor account and permission matrices synchronized successfully.',
        supervisor: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          isActive: updatedUser.isActive,
          updatedAt: updatedUser.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Supervisor PATCH handler error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Permanently delete a supervisor user account (Admin only)
 */
export async function DELETE(req: Request, context: RouteContext) {
  try {
    // 1. Authenticate user
    const currentUser = await getUserFromRequest();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid credentials' },
        { status: 401 }
      );
    }

    // 2. Authorize: ADMIN only
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges. Admin only.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // 3. Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser || targetUser.role !== 'SUPERVISOR') {
      return NextResponse.json(
        { error: 'Not Found: Target supervisor account does not exist' },
        { status: 404 }
      );
    }

    // 4. Delete user (Cascade onDelete rules on Permission will clean up permissions table automatically)
    await prisma.user.delete({
      where: { id },
    });

    // 5. Audit log actions
    await logAction(currentUser.userId, 'DELETE_SUPERVISOR', 'Employees', {
      affectedSupervisorId: id,
      deletedSupervisorEmail: targetUser.email,
      deletedSupervisorName: targetUser.name,
    });

    return NextResponse.json(
      { message: 'Supervisor account permanently removed from registry.' },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Supervisor DELETE handler error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
