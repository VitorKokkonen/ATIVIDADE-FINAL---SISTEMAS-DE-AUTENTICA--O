import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRefreshToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  // Best-effort server-side revocation
  if (refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    if (payload) {
      await prisma.user.update({
        where: { id: payload.userId },
        data: { refreshToken: null },
      });
    }
  }

  // Clear cookies
  cookieStore.set('accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  cookieStore.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return NextResponse.json({ ok: true });
}
