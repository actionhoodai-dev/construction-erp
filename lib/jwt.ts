import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-12345';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  role: 'ADMIN' | 'SUPERVISOR';
  email: string;
}

/**
 * Pure, Edge-safe JWT verification using jose with zero database dependencies.
 */
export async function verifyJWT(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}
