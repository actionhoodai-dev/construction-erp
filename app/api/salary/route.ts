import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, isAuthorized } from '@/lib/auth';
import { logAction } from '@/utils/permissions';
import { salarySchema } from '@/lib/schemas';

/**
 * GET - Retrieve all salary/payroll records (Read access required)
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user from secure httpOnly cookie
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid credentials' }, { status: 401 });
    }

    // 2. Check Module Permission via strict server-side RBAC
    const hasAccess = await isAuthorized(user, 'Salary', 'read');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Insufficient module access privileges' }, { status: 403 });
    }

    // 3. Fetch salary records with associated employee details from Neon PostgreSQL
    const salaryRecords = await prisma.salaryRecord.findMany({
      orderBy: { month: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            role: true,
            salaryType: true,
          },
        },
      },
    });

    return NextResponse.json(salaryRecords, { status: 200 });
  } catch (error: any) {
    console.error('Salary GET handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

/**
 * POST - Log or update a salary record for an employee (Write access required)
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user from secure httpOnly cookie
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid credentials' }, { status: 401 });
    }

    // 2. Check Module Permission via strict server-side RBAC
    const hasAccess = await isAuthorized(user, 'Salary', 'write');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Insufficient module access privileges' }, { status: 403 });
    }

    // 3. Parse and Validate body using Zod schema
    const body = await req.json();

    // Ensure totalSalary is parsed as a number if it is sent as string, to satisfy Zod schema number type
    if (body && typeof body.totalSalary === 'string') {
      const parsedVal = parseFloat(body.totalSalary);
      if (!isNaN(parsedVal)) {
        body.totalSalary = parsedVal;
      }
    }

    // Normalize paid status if provided
    if (body && typeof body.paidStatus === 'string') {
      body.paidStatus = body.paidStatus.toUpperCase();
    }

    const validationResult = salarySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { employeeId, month, totalSalary, paidStatus } = validationResult.data;

    // 4. Validate that Employee exists (Foreign Key Check)
    const employeeExists = await prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employeeExists) {
      return NextResponse.json(
        { error: `Employee with ID ${employeeId} does not exist.` },
        { status: 404 }
      );
    }

    // 5. Upsert the salary record (create if doesn't exist, update if it already exists for employee + month)
    const salaryRecord = await prisma.salaryRecord.upsert({
      where: {
        employeeId_month: {
          employeeId,
          month,
        },
      },
      update: {
        totalSalary,
        paidStatus,
      },
      create: {
        employeeId,
        month,
        totalSalary,
        paidStatus,
      },
      include: {
        employee: {
          select: {
            name: true,
          },
        },
      },
    });

    // 6. Log action in AuditLog on server-side
    await logAction(user.userId, 'LOG_SALARY_RECORD', 'Salary', {
      salaryRecordId: salaryRecord.id,
      employeeName: salaryRecord.employee.name,
      month: salaryRecord.month,
      totalSalary: salaryRecord.totalSalary,
      paidStatus: salaryRecord.paidStatus,
    });

    return NextResponse.json(
      { message: 'Salary record logged successfully', salaryRecord },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Salary POST handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
