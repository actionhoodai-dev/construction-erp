import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, isAuthorized } from '@/lib/auth';
import { logAction } from '@/utils/permissions';
import { employeeSchema } from '@/lib/schemas';

/**
 * GET - Retrieve all employees (Read access required)
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user from secure httpOnly cookie
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid credentials' }, { status: 401 });
    }

    // 2. Check Module Permission via strict server-side RBAC
    const hasAccess = await isAuthorized(user, 'Employees', 'read');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Insufficient module access privileges' }, { status: 403 });
    }

    // 3. Fetch employees from PostgreSQL Neon
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        attendance: {
          take: 5, // Return last 5 attendance entries as quick summary
          orderBy: { date: 'desc' },
        },
        salaryRecords: {
          take: 3, // Return last 3 payroll cycles
          orderBy: { month: 'desc' },
        },
      },
    });

    return NextResponse.json(employees, { status: 200 });
  } catch (error: any) {
    console.error('Employees GET handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

/**
 * POST - Create a new employee record (Write access required)
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user from secure httpOnly cookie
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid credentials' }, { status: 401 });
    }

    // 2. Check Module Permission via strict server-side RBAC
    const hasAccess = await isAuthorized(user, 'Employees', 'write');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Insufficient module access privileges' }, { status: 403 });
    }

    // 3. Parse and Validate body using Zod schema
    const body = await req.json();
    const validationResult = employeeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, phone, role, salaryType } = validationResult.data;

    // 4. Create employee
    const newEmployee = await prisma.employee.create({
      data: {
        name,
        phone,
        role,
        salaryType,
      },
    });

    // 5. Log action in AuditLog on server-side
    await logAction(user.userId, 'CREATE_EMPLOYEE', 'Employees', {
      employeeId: newEmployee.id,
      employeeName: newEmployee.name,
      employeeRole: newEmployee.role,
    });

    return NextResponse.json(
      { message: 'Employee record created successfully', employee: newEmployee },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Employees POST handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
