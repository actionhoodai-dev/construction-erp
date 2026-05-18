import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { hashPassword, comparePassword, generateToken } from '@/utils/auth';
import { verifyJWT } from '@/lib/jwt';
import { logAction } from '@/utils/permissions';
import { checkRateLimit } from '@/lib/auth';
import { loginSchema, registerSchema } from '@/lib/schemas';

// Standard list of ERP Modules
const ERP_MODULES = ['Inventory', 'Employees', 'Projects', 'Salary', 'AuditLogs'];

/**
 * Extracts the client IP address from the request headers
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

/**
 * GET handler: Dynamic secure session verification endpoint.
 * Reads the secure httpOnly cookie, decodes the user profile, and returns permissions.
 */
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('erp_token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Query active user state from PostgreSQL Neon
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const dbPermissions = await prisma.permission.findMany({
      where: { userId: user.id },
      include: { module: true },
    });

    const permissions = dbPermissions.reduce((acc: Record<string, { read: boolean; write: boolean }>, p) => {
      acc[p.module.name] = { read: p.canRead, write: p.canWrite };
      return acc;
    }, {});

    if (user.role === 'ADMIN') {
      for (const mod of ERP_MODULES) {
        permissions[mod] = { read: true, write: true };
      }
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Session API error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

/**
 * Ensures system modules are seeded in the database.
 */
async function ensureModulesSeeded() {
  try {
    for (const name of ERP_MODULES) {
      await prisma.module.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
  } catch (error) {
    console.error('Failed to seed default ERP modules:', error);
  }
}

/**
 * POST handler: Handles user login, register, and logout.
 */
export async function POST(req: Request) {
  try {
    await ensureModulesSeeded();
    const body = await req.json();
    const { action } = body;

    // --- Action: LOGOUT ---
    if (action === 'logout') {
      const cookieStore = await cookies();
      cookieStore.delete('erp_token');

      return NextResponse.json({ message: 'Logout successful' }, { status: 200 });
    }

    // --- Action: REGISTER ---
    if (action === 'register') {
      // Validate schema
      const validationResult = registerSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { name, email, password, role } = validationResult.data;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }

      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
      });

      // If Supervisor, automatically seed empty permissions for each module
      if (role === 'SUPERVISOR') {
        const modules = await prisma.module.findMany();
        for (const moduleObj of modules) {
          await prisma.permission.create({
            data: {
              userId: user.id,
              moduleId: moduleObj.id,
              canRead: true,  // Default supervisors can read
              canWrite: false, // Default supervisors cannot write
            },
          });
        }
      }

      // Log registration action
      await logAction(user.id, 'USER_REGISTER', 'AuditLogs', {
        registeredUser: { id: user.id, email: user.email, role: user.role },
      });

      return NextResponse.json(
        {
          message: 'User registered successfully',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
          },
        },
        { status: 201 }
      );
    }

    // --- Action: LOGIN ---
    if (action === 'login') {
      const clientIp = getClientIp(req);
      
      // Enforce rate limiter (5 requests per minute)
      const rateLimit = checkRateLimit(clientIp, 5, 60000);
      if (!rateLimit.success) {
        return NextResponse.json(
          { error: `Too many login attempts. Please wait ${Math.ceil((rateLimit.reset - Date.now()) / 1000)} seconds.` },
          { status: 429 }
        );
      }

      // Validate login schema
      const validationResult = loginSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { email, password } = validationResult.data;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Generate JWT Token
      const token = generateToken({
        userId: user.id,
        role: user.role,
        email: user.email,
      });

      // Query user's permissions mapped to module names
      const dbPermissions = await prisma.permission.findMany({
        where: { userId: user.id },
        include: { module: true },
      });

      const permissions = dbPermissions.reduce((acc: Record<string, { read: boolean; write: boolean }>, p) => {
        acc[p.module.name] = { read: p.canRead, write: p.canWrite };
        return acc;
      }, {});

      // If user is ADMIN, grant full read/write bypass for all modules in frontend state
      if (user.role === 'ADMIN') {
        for (const mod of ERP_MODULES) {
          permissions[mod] = { read: true, write: true };
        }
      }

      // Log success login action
      await logAction(user.id, 'USER_LOGIN', 'AuditLogs', {
        email: user.email,
        role: user.role,
      });

      // Save token securely inside secure HTTP-Only cookie
      const cookieStore = await cookies();
      cookieStore.set('erp_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      });

      return NextResponse.json(
        {
          message: 'Login successful',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions,
          },
        },
        { status: 200 }
      );
    }

    // Fallback if action is unsupported
    return NextResponse.json(
      { error: 'Invalid action. Must be register, login or logout' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Auth handler error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
