import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { hashPassword } from '@/utils/auth';
import { logAction } from '@/utils/permissions';
import { supervisorCreateSchema } from '@/lib/schemas';

/**
 * GET - Retrieve all supervisors and their permissions (Admin only)
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user from secure context
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

    // 3. Fetch all supervisors and system modules from DB
    const [supervisors, modules] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'SUPERVISOR' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          permissions: {
            select: {
              id: true,
              moduleId: true,
              canRead: true,
              canWrite: true,
              module: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.module.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ supervisors, modules }, { status: 200 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Supervisors GET handler error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Register a new supervisor with default modules permissions (Admin only)
 */
export async function POST(req: Request) {
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

    // 3. Validate request payload using Zod schema
    const body = await req.json();
    const validation = supervisorCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    // 4. Prevent duplicate user accounts
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Conflict: A user with this email already exists' },
        { status: 409 }
      );
    }

    // 5. Hash password securely
    const hashedPassword = await hashPassword(password);

    // 6. Use database transaction to create User and initialize permissions
    const newSupervisor = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'SUPERVISOR',
          isActive: true,
        },
      });

      // Fetch all system modules
      const modules = await tx.module.findMany();

      // Seed standard default permissions (read: true, write: false)
      for (const mod of modules) {
        await tx.permission.create({
          data: {
            userId: user.id,
            moduleId: mod.id,
            canRead: true,
            canWrite: false,
          },
        });
      }

      return user;
    });

    // 7. Audit log action
    await logAction(currentUser.userId, 'CREATE_SUPERVISOR', 'Employees', {
      supervisorId: newSupervisor.id,
      supervisorEmail: newSupervisor.email,
      supervisorName: newSupervisor.name,
    });

    return NextResponse.json(
      {
        message: 'Supervisor account created and initialized successfully.',
        supervisor: {
          id: newSupervisor.id,
          name: newSupervisor.name,
          email: newSupervisor.email,
          isActive: newSupervisor.isActive,
          createdAt: newSupervisor.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Supervisor POST handler error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
