import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, isAuthorized } from '@/lib/auth';
import { logAction } from '@/utils/permissions';
import { inventorySchema } from '@/lib/schemas';

/**
 * GET - Retrieve all inventory items (Read access required)
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user from secure httpOnly cookie
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid credentials' }, { status: 401 });
    }

    // 2. Check Module Permission via strict server-side RBAC
    const hasAccess = await isAuthorized(user, 'Inventory', 'read');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Insufficient module access privileges' }, { status: 403 });
    }

    // 3. Fetch inventory items and include project site details if mapped from Neon PostgreSQL
    const inventory = await prisma.inventoryItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    return NextResponse.json(inventory, { status: 200 });
  } catch (error: any) {
    console.error('Inventory GET handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

/**
 * POST - Add a new inventory item / material log (Write access required)
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user from secure httpOnly cookie
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid credentials' }, { status: 401 });
    }

    // 2. Check Module Permission via strict server-side RBAC
    const hasAccess = await isAuthorized(user, 'Inventory', 'write');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Insufficient module access privileges' }, { status: 403 });
    }

    // 3. Parse and Validate body using Zod schema
    const body = await req.json();
    
    // Ensure quantity is parsed as a number if it is sent as string, to satisfy Zod schema number type
    if (body && typeof body.quantity === 'string') {
      const parsedQty = parseFloat(body.quantity);
      if (!isNaN(parsedQty)) {
        body.quantity = parsedQty;
      }
    }

    const validationResult = inventorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, quantity, unit, projectId } = validationResult.data;

    // 4. Validate that Project exists if projectId is provided (Foreign Key Check)
    if (projectId) {
      const projectExists = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!projectExists) {
        return NextResponse.json(
          { error: `Project with ID ${projectId} does not exist.` },
          { status: 404 }
        );
      }
    }

    // 5. Create inventory item
    const newItem = await prisma.inventoryItem.create({
      data: {
        name,
        quantity,
        unit,
        projectId: projectId || null,
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    // 6. Log action in AuditLog on server-side
    await logAction(user.userId, 'CREATE_INVENTORY_ITEM', 'Inventory', {
      itemId: newItem.id,
      itemName: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      assignedProject: newItem.project?.name || 'Warehouse',
    });

    return NextResponse.json(
      { message: 'Inventory item added successfully', item: newItem },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Inventory POST handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
