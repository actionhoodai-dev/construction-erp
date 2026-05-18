import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyJWT, TokenPayload } from '@/lib/jwt';

/**
 * Extracts and authenticates the user from the incoming server request cookie context
 */
export async function getUserFromRequest(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('erp_token')?.value;
    if (!token) return null;
    return await verifyJWT(token);
  } catch (error) {
    return null;
  }
}

/**
 * Queries database-level supervisor permissions mapped to module names
 */
export async function getUserPermissions(userId: string) {
  try {
    const dbPermissions = await prisma.permission.findMany({
      where: { userId },
      include: { module: true },
    });

    return dbPermissions.reduce((acc, p) => {
      acc[p.module.name] = { read: p.canRead, write: p.canWrite };
      return acc;
    }, {} as Record<string, { read: boolean; write: boolean }>);
  } catch (error) {
    console.error('Failed to query user permissions:', error);
    return {};
  }
}

/**
 * Validates role-based and permission-based authorization for modules
 */
export async function isAuthorized(
  user: TokenPayload,
  moduleName: string,
  action: 'read' | 'write'
): Promise<boolean> {
  if (user.role === 'ADMIN') return true; // Server-side admin global bypass
  
  if (user.role === 'SUPERVISOR') {
    const permissions = await getUserPermissions(user.userId);
    const perm = permissions[moduleName];
    if (!perm) return false;
    return action === 'read' ? perm.read : perm.write;
  }

  return false;
}

// In-memory rate limiting map tracking IP login attempts
const loginAttemptsMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple, high-performance in-memory rate limiter to protect auth route from brute force
 */
export function checkRateLimit(
  ip: string,
  limit = 5,
  windowMs = 60000
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const client = loginAttemptsMap.get(ip);

  if (!client || now > client.resetTime) {
    const resetTime = now + windowMs;
    loginAttemptsMap.set(ip, { count: 1, resetTime });
    return { success: true, remaining: limit - 1, reset: resetTime };
  }

  if (client.count >= limit) {
    return { success: false, remaining: 0, reset: client.resetTime };
  }

  client.count += 1;
  return { success: true, remaining: limit - client.count, reset: client.resetTime };
}
