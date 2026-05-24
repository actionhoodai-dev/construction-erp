import { z } from 'zod';

/**
 * Zod validation schema for employee registration/edit
 */
export const employeeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  phone: z.string().trim().min(5, 'Phone number must be at least 5 characters.'),
  role: z.string().trim().min(1, 'Role/Title is required.'),
  salaryType: z.enum(['DAILY', 'MONTHLY', 'HOURLY']),
});

/**
 * Zod validation schema for construction project sites
 */
export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required.'),
  location: z.string().trim().min(1, 'Location is required.'),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']),
});

/**
 * Zod validation schema for raw material assets/stocks
 */
export const inventorySchema = z.object({
  name: z.string().trim().min(1, 'Material name is required.'),
  quantity: z.number().positive('Quantity must be a strict positive number (greater than 0).'),
  unit: z.string().trim().min(1, 'Unit of measurement is required.'),
  projectId: z.string().uuid().or(z.string().cuid()).optional().nullable(),
});

/**
 * Zod validation schema for monthly salary compensation records
 */
export const salarySchema = z.object({
  employeeId: z.string().cuid('Employee ID must be a valid CUID.'),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Month must follow the strict YYYY-MM format (e.g. 2026-05).',
  }),
  totalSalary: z.number().nonnegative('Total salary compensation cannot be negative.'),
  paidStatus: z.enum(['PAID', 'UNPAID', 'PENDING']),
});

/**
 * Zod validation schemas for auth registration and login actions
 */
export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  email: z.string().trim().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['ADMIN', 'SUPERVISOR']),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

/**
 * Zod validation schema for daily attendance checks
 */
export const dailyAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format.'),
  records: z.array(
    z.object({
      employeeId: z.string().cuid('Employee ID must be a valid CUID.'),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'LEAVE']),
    })
  ),
});

/**
 * Zod validation schema for creating a supervisor
 */
export const supervisorCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  email: z.string().trim().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  projectId: z.string().cuid('Project ID must be a valid CUID.').optional().nullable(),
});

/**
 * Zod validation schema for updating a supervisor
 */
export const supervisorUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').optional(),
  email: z.string().trim().email('Invalid email address.').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters.').optional(),
  isActive: z.boolean().optional(),
  projectId: z.string().cuid('Project ID must be a valid CUID.').optional().nullable(),
  permissions: z.array(
    z.object({
      moduleId: z.string().cuid('Module ID must be a valid CUID.'),
      canRead: z.boolean(),
      canWrite: z.boolean(),
    })
  ).optional(),
});

/**
 * Zod validation schema for updating user profile settings
 */
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').optional(),
  email: z.string().trim().email('Invalid email address.').optional(),
  currentPassword: z.string().min(1, 'Current password is required.').optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.').optional(),
}).refine(
  (data) => {
    // If newPassword is provided, currentPassword must also be provided
    if (data.newPassword && !data.currentPassword) return false;
    return true;
  },
  { message: 'Current password is required when setting a new password.', path: ['currentPassword'] }
);
