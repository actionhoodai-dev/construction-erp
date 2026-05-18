import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, isAuthorized } from '@/lib/auth';

/**
 * GET - Retrieve system audit logs (Read access to 'AuditLogs' module required)
 * Limited to the 100 most recent logs for security and performance.
 */
export async function GET(req: Request) {
  try {
    // 1. Authenticate user from secure httpOnly cookie
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid credentials' }, { status: 401 });
    }

    // 2. Check Module Permission via strict server-side RBAC
    const hasAccess = await isAuthorized(user, 'AuditLogs', 'read');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Insufficient module access privileges' }, { status: 403 });
    }

    // 3. Fetch audit logs sorted by newest first from Neon PostgreSQL
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to recent 100 records for server efficiency
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(logs, { status: 200 });
  } catch (error: any) {
    console.error('Audit GET handler error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
