import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './db';
import { hashPassword, verifyPassword } from './password';
import type { User } from '@/types';

export { hashPassword, verifyPassword };

export const SESSION_COOKIE = 'session';
const SESSION_DURATION = '7d';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string, username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<{ userId: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return null;
    return { userId: payload.sub, username: String(payload.username ?? '') };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ userId: string; username: string } | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

const userSelect = {
  id: true,
  username: true,
  name: true,
  avatar: true,
  color: true,
  glowColor: true,
  accentBg: true,
  role: true,
} as const;

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: userSelect,
  });
  return user;
}
