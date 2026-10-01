import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from './prisma';

export const SESSION_COOKIE_NAME = 'apex_session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'apex_crm_super_secure_auth_session_secret_jwt_key_2026'
);

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Creates a signed JWT session token valid for 7 days.
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Verifies a JWT session token and returns the payload.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: (payload.role as string) || 'rep',
    };
  } catch {
    return null;
  }
}

/**
 * Reads and verifies the current session user from incoming cookies in Server Components or API Routes.
 */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Helper to fetch full database user if needed.
 */
export async function getCurrentDbUser() {
  const session = await getCurrentUser();
  if (!session) return null;

  try {
    return await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  } catch {
    return null;
  }
}
