import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, isAuthorized } from '@/lib/auth';
import { logAction } from '@/utils/permissions';
import { dailyAttendanceSchema } from '@/lib/schemas';

/**
 * GET - Retrieve workforce directory with attendance logs for a specific date
 * Query Parameters: ?date=YYYY-MM-DD
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user from secure httpOnly cookie context
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid credentials' },
        { status: 401 }
      );
    }

    // 2. Authorize via granular 'Employees' module read privilege
    const hasAccess = await isAuthorized(user, 'Employees', 'read');
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient module access privileges' },
        { status: 403 }
      );
    }

    // 3. Extract and normalize date query parameter
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    let dateStr = dateParam;
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // Default to today's date formatted as YYYY-MM-DD in local time
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      dateStr = `${yyyy}-${mm}-${dd}`;
    }

    // Create a strict UTC midnight date object for matching
    const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

    // 4. Fetch all employees and check if an attendance entry exists for the target date
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
      include: {
        attendance: {
          where: {
            date: targetDate,
          },
        },
      },
    });

    // 5. Format results to return a simplified shape
    const formattedWorkforce = employees.map((emp: any) => {
      const dailyLog = emp.attendance[0] || null;
      return {
        id: emp.id,
        name: emp.name,
        phone: emp.phone,
        role: emp.role,
        salaryType: emp.salaryType,
        attendance: dailyLog ? { id: dailyLog.id, status: dailyLog.status } : null,
      };
    });

    return NextResponse.json(
      {
        date: dateStr,
        workforce: formattedWorkforce,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Attendance GET handler error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Save or update daily attendance logs for the entire workforce
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user from secure httpOnly cookie context
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid credentials' },
        { status: 401 }
      );
    }

    // 2. Authorize via granular 'Employees' module write privilege
    const hasAccess = await isAuthorized(user, 'Employees', 'write');
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient module access privileges' },
        { status: 403 }
      );
    }

    // 3. Parse and Validate body using Zod schema
    const body = await req.json();
    const validationResult = dailyAttendanceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { date, records } = validationResult.data;

    // Enforce that attendance can ONLY be saved/updated for the current date
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (date !== todayStr) {
      return NextResponse.json(
        { error: 'Forbidden: Attendance logs can only be recorded or modified for the current date.' },
        { status: 403 }
      );
    }

    const targetDate = new Date(`${date}T00:00:00.000Z`);

    // 4. Batch upsert daily logs in a strict transaction database context
    await prisma.$transaction(
      records.map((rec) =>
        prisma.attendance.upsert({
          where: {
            employeeId_date: {
              employeeId: rec.employeeId,
              date: targetDate,
            },
          },
          update: {
            status: rec.status,
          },
          create: {
            employeeId: rec.employeeId,
            date: targetDate,
            status: rec.status,
          },
        })
      )
    );

    // 5. Write an operational Audit Log entry
    await logAction(user.userId, 'UPDATE_ATTENDANCE', 'Employees', {
      date,
      totalUpdated: records.length,
    });

    return NextResponse.json(
      { message: 'Daily attendance logs synchronized successfully.' },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Attendance POST handler error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', details: err.message },
      { status: 500 }
    );
  }
}
