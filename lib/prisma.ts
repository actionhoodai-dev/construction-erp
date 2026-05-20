import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// ---------------------------------------------------------------------------
// Lazy Prisma singleton
// ---------------------------------------------------------------------------
// We intentionally do NOT create the PrismaClient at module evaluation time.
// If DATABASE_URL is missing (or wrong), a top-level throw would cause Next.js
// to serve an HTML error page for every /api/* request, breaking JSON.parse()
// with "Unexpected token '<', '<!DOCTYPE'..." in the browser console.
//
// Instead, the client is created on first *access*. Any error then propagates
// into the route handler's try/catch block, which returns a proper JSON 500.
// ---------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      '[prisma.ts] DATABASE_URL is not set. ' +
        'Add it to .env.local → DATABASE_URL="postgresql://..."'
    );
  }

  const pool = new Pool({
    connectionString,
    max: process.env.NODE_ENV === 'production' ? 15 : 4,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 20_000, // long enough for Neon cold starts
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

// Lazily-resolved singleton ─ only constructed on first property access.
// Using a Proxy ensures the actual client is never created at import time.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    // Resolve (and cache) the real client on first access
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = buildPrismaClient();
    }
    const value = (globalForPrisma.prisma as any)[prop];
    return typeof value === 'function'
      ? value.bind(globalForPrisma.prisma)
      : value;
  },
});

export default prisma;
