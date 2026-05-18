import { prisma } from '@/lib/prisma';

/**
 * Checks if a user has permission to read or write to a specific module.
 * Admins automatically have full permission to all modules.
 * Supervisors have granular permissions based on the database mapping.
 */
export async function checkPermission(
  userId: string,
  userRole: 'ADMIN' | 'SUPERVISOR',
  moduleName: string,
  action: 'read' | 'write'
): Promise<boolean> {
  // 1. ADMIN role has absolute access to all modules and actions
  if (userRole === 'ADMIN') {
    return true;
  }

  try {
    // 2. Query the module and user permission from database
    const permission = await prisma.permission.findFirst({
      where: {
        userId: userId,
        module: {
          name: {
            equals: moduleName,
            mode: 'insensitive', // Case-insensitive comparison
          },
        },
      },
    });

    if (!permission) {
      return false; // No explicit permission row found, default to deny
    }

    // 3. Return the specific permission flag based on action
    if (action === 'read') {
      return permission.canRead;
    } else if (action === 'write') {
      return permission.canWrite;
    }

    return false;
  } catch (error) {
    console.error(`Permission check failed for User: ${userId}, Module: ${moduleName}`, error);
    return false; // Fail-safe default to deny access on error
  }
}

/**
 * Utility helper to create a database-backed Audit Log entry.
 * Can be called pro-actively in any controller to record actions.
 */
export async function logAction(
  userId: string | null,
  action: string,
  moduleName: string,
  details: Record<string, any> | null = null
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        module: moduleName,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
      },
    });
  } catch (error) {
    console.error('Failed to write Audit Log to database:', error);
  }
}
