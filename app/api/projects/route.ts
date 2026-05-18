import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, isAuthorized } from '@/lib/auth';
import { logAction } from '@/utils/permissions';
import { projectSchema } from '@/lib/schemas';

/**
 * GET - Retrieve all construction projects (Read access required)
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user from secure httpOnly cookie
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid credentials' }, { status: 401 });
    }

    // 2. Check Module Permission via strict server-side RBAC
    const hasAccess = await isAuthorized(user, 'Projects', 'read');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Insufficient module access privileges' }, { status: 403 });
    }

    // 3. Fetch projects with associated inventory items from Neon PostgreSQL
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        inventoryItems: {
          select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
          },
        },
      },
    });

    return NextResponse.json(projects, { status: 200 });
  } catch (error: any) {
    console.error('Projects GET handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

/**
 * POST - Create a new project site (Write access required)
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user from secure httpOnly cookie
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid credentials' }, { status: 401 });
    }

    // 2. Check Module Permission via strict server-side RBAC
    const hasAccess = await isAuthorized(user, 'Projects', 'write');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Insufficient module access privileges' }, { status: 403 });
    }

    // 3. Parse and Validate body using Zod schema
    const body = await req.json();
    
    // Normalize status spacing/case to ensure compatibility prior to parse
    if (body && typeof body.status === 'string') {
      body.status = body.status.toUpperCase().replace(' ', '_');
    }

    const validationResult = projectSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, location, status } = validationResult.data;

    // 4. Create project site
    const newProject = await prisma.project.create({
      data: {
        name,
        location,
        status,
      },
    });

    // 5. Log action in AuditLog on server-side
    await logAction(user.userId, 'CREATE_PROJECT', 'Projects', {
      projectId: newProject.id,
      projectName: newProject.name,
      location: newProject.location,
    });

    return NextResponse.json(
      { message: 'Project site created successfully', project: newProject },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Projects POST handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
