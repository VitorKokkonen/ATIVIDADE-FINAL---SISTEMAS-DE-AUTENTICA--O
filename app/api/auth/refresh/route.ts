import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token provided' }, { status: 401 });
    }

    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.refreshToken) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    // Compare hash to avoid plaintext token comparison/storage
    const incomingHash = hashToken(refreshToken);
    if (user.refreshToken !== incomingHash) {
      // Possible token reuse/replay: revoke stored token
      await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
      cookieStore.set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      });
      cookieStore.set('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/',
      });
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }

    const role = user.role === 'ADMIN' ? 'ADMIN' : 'USER';

    // Rotate refresh token and mint a new access token
    const newAccessToken = signAccessToken({ userId: user.id, role });
    const newRefreshToken = signRefreshToken({ userId: user.id, tokenId: crypto.randomUUID() });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashToken(newRefreshToken) },
    });

    cookieStore.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
      path: '/',
    });
    cookieStore.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
